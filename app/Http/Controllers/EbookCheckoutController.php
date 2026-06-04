<?php

namespace App\Http\Controllers;

use App\Mail\EbookPurchaseAccessMail;
use App\Models\Ebook;
use App\Models\EbookPurchase;
use App\Models\User;
use App\Services\WompiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class EbookCheckoutController extends Controller
{
    public function __construct(
        protected WompiService $wompiService
    ) {
    }

    public function create(Request $request, string $slug): JsonResponse
    {
        $ebook = Ebook::query()->where('slug', $slug)->firstOrFail();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:32'],
            'grant_all_ebooks' => ['nullable', 'boolean'],
            'offer_code' => ['nullable', 'string', 'max:100'],
        ]);

        $user = $request->user();

        if ($user && $user->ebooks()->whereKey($ebook->id)->exists()) {
            return response()->json([
                'message' => 'Tu cuenta ya tiene acceso a este ebook.',
            ], 422);
        }

        if (! $user && User::query()->where('email', $data['email'])->exists()) {
            return response()->json([
                'message' => 'Ya existe una cuenta con este correo. Inicia sesion para completar la compra y recibir acceso.',
            ], 422);
        }

        $purchase = EbookPurchase::create([
            'ebook_id' => $ebook->id,
            'user_id' => $user?->id,
            'purchaser_name' => $user?->name ?? $data['name'],
            'purchaser_email' => $user?->email ?? $data['email'],
            'purchaser_phone' => $this->normalizePhone($user?->phone ?? $data['phone']),
            'amount_in_cents' => $ebook->price_in_cents,
            'currency' => 'COP',
            'reference' => $this->generateReference($ebook),
            'grant_all_ebooks' => (bool) ($data['grant_all_ebooks'] ?? false),
            'offer_code' => $data['offer_code'] ?? null,
            'wompi_status' => 'PENDING',
            'checkout_expires_at' => $ebook->price_in_cents > 0 ? now()->addMinutes(30) : null,
            'ip_address' => $request->ip(),
        ]);

        if ($ebook->price_in_cents < 1) {
            $purchase->forceFill([
                'wompi_status' => 'APPROVED',
                'wompi_status_message' => 'Acceso gratuito activado automaticamente.',
                'approved_at' => now(),
            ])->save();

            $this->fulfillPurchase($purchase);

            return response()->json([
                'purchase' => $this->purchasePayload($purchase->fresh(['user'])),
                'direct_access' => true,
                'message' => 'Acceso gratuito activado. Revisa tu correo para entrar a la biblioteca.',
            ]);
        }

        abort_unless(filled(config('services.wompi.public_key')) && filled(config('services.wompi.integrity_secret')), 422, 'Wompi no esta configurado todavia.');

        $redirectUrl = $purchase->grant_all_ebooks
            ? route('offers.bundle')
            : route('ebooks.share', ['slug' => $ebook->slug]);

        $redirectUrl .= '?' . http_build_query([
            'purchase' => $purchase->reference,
        ]);

        $checkout = $this->wompiService->checkoutConfig([
            'amount_in_cents' => $purchase->amount_in_cents,
            'currency' => $purchase->currency,
            'reference' => $purchase->reference,
            'redirect_url' => $redirectUrl,
            'expiration_time' => optional($purchase->checkout_expires_at)->toIso8601String(),
        ], [
            'name' => $purchase->purchaser_name,
            'email' => $purchase->purchaser_email,
            'phone' => $purchase->purchaser_phone,
        ]);

        return response()->json([
            'purchase' => [
                'reference' => $purchase->reference,
                'status' => $purchase->wompi_status,
            ],
            'checkout' => $checkout,
        ]);
    }

    public function sync(Request $request, string $slug, string $reference): JsonResponse
    {
        $ebook = Ebook::query()->where('slug', $slug)->firstOrFail();
        $purchase = EbookPurchase::query()
            ->where('ebook_id', $ebook->id)
            ->where('reference', $reference)
            ->firstOrFail();

        $data = $request->validate([
            'transaction_id' => ['nullable', 'string', 'max:255'],
        ]);

        if (! empty($data['transaction_id']) && $purchase->wompi_transaction_id !== $data['transaction_id']) {
            $purchase->forceFill(['wompi_transaction_id' => $data['transaction_id']])->save();
        }

        if ($purchase->wompi_transaction_id) {
            $this->syncPurchaseByTransactionId($purchase, $purchase->wompi_transaction_id);
        }

        return response()->json([
            'purchase' => $this->purchasePayload($purchase->fresh(['user'])),
        ]);
    }

    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        if (! $this->wompiService->validateEventSignature($payload)) {
            return response()->json(['ok' => false], 422);
        }

        if (($payload['event'] ?? null) !== 'transaction.updated') {
            return response()->json(['ok' => true]);
        }

        $transaction = data_get($payload, 'data.transaction');
        $reference = data_get($transaction, 'reference');

        if (! $reference) {
            return response()->json(['ok' => true]);
        }

        $purchase = EbookPurchase::query()->where('reference', $reference)->first();

        if ($purchase) {
            $this->applyTransactionToPurchase($purchase, (array) $transaction);
        }

        return response()->json(['ok' => true]);
    }

    public function purchasePayload(?EbookPurchase $purchase): ?array
    {
        if (! $purchase) {
            return null;
        }

        return [
            'reference' => $purchase->reference,
            'status' => $purchase->wompi_status,
            'status_message' => $purchase->wompi_status_message,
            'transaction_id' => $purchase->wompi_transaction_id,
            'approved_at' => optional($purchase->approved_at)->toIso8601String(),
            'credentials_emailed_at' => optional($purchase->credentials_emailed_at)->toIso8601String(),
            'has_user' => (bool) $purchase->user_id,
            'grant_all_ebooks' => (bool) $purchase->grant_all_ebooks,
            'offer_code' => $purchase->offer_code,
        ];
    }

    public function syncPurchaseByTransactionId(EbookPurchase $purchase, string $transactionId): EbookPurchase
    {
        $transaction = $this->wompiService->fetchTransaction($transactionId);

        return $this->applyTransactionToPurchase($purchase, $transaction);
    }

    protected function applyTransactionToPurchase(EbookPurchase $purchase, array $transaction): EbookPurchase
    {
        $purchase->fill([
            'wompi_transaction_id' => $transaction['id'] ?? $purchase->wompi_transaction_id,
            'wompi_status' => $transaction['status'] ?? $purchase->wompi_status,
            'wompi_status_message' => $transaction['status_message'] ?? $purchase->wompi_status_message,
            'wompi_environment' => $transaction['environment'] ?? $purchase->wompi_environment,
            'transaction_payload' => $transaction,
        ]);

        if (($transaction['status'] ?? null) === 'APPROVED') {
            $this->fulfillPurchase($purchase);
        } else {
            $purchase->save();
        }

        return $purchase->fresh(['user']);
    }

    protected function fulfillPurchase(EbookPurchase $purchase): void
    {
        DB::transaction(function () use ($purchase) {
            $freshPurchase = EbookPurchase::query()
                ->with(['ebook', 'user'])
                ->lockForUpdate()
                ->findOrFail($purchase->id);

            $plainPassword = null;
            $user = $freshPurchase->user;

            if (! $user) {
                $user = User::query()->where('email', $freshPurchase->purchaser_email)->first();
            }

            if (! $user) {
                $plainPassword = Str::password(12, true, true, false, false);
                $user = User::create([
                    'name' => $freshPurchase->purchaser_name,
                    'email' => $freshPurchase->purchaser_email,
                    'phone' => $freshPurchase->purchaser_phone,
                    'password' => Hash::make($plainPassword),
                    'is_auto_generated' => true,
                ]);
            } else {
                $user->forceFill([
                    'phone' => $user->phone ?: $freshPurchase->purchaser_phone,
                ])->save();
            }

            if (! $user->hasRole('reader')) {
                $user->assignRole('reader');
            }

            $ebookIds = $freshPurchase->grant_all_ebooks
                ? Ebook::query()->where('status', 'Activo')->pluck('id')->all()
                : [$freshPurchase->ebook_id];

            $user->ebooks()->syncWithoutDetaching(
                collect($ebookIds)->mapWithKeys(fn (int $ebookId) => [
                    $ebookId => [
                        'ebook_purchase_id' => $freshPurchase->id,
                        'granted_at' => now(),
                    ],
                ])->all()
            );

            $freshPurchase->forceFill([
                'user_id' => $user->id,
                'wompi_status' => 'APPROVED',
                'approved_at' => $freshPurchase->approved_at ?? now(),
            ])->save();

            if (! $freshPurchase->credentials_emailed_at) {
                Mail::to($user->email)->send(new EbookPurchaseAccessMail(
                    ebook: $freshPurchase->ebook,
                    userName: $user->name,
                    userEmail: $user->email,
                    plainPassword: $plainPassword,
                    loginUrl: route('login'),
                    libraryUrl: route('library.index'),
                ));

                $freshPurchase->forceFill([
                    'credentials_emailed_at' => now(),
                ])->save();
            }
        });
    }

    protected function generateReference(Ebook $ebook): string
    {
        return 'NUTRI-' . Str::upper(Str::random(6)) . '-' . $ebook->id . '-' . now()->format('His');
    }

    protected function normalizePhone(string $phone): string
    {
        $normalized = preg_replace('/\D+/', '', $phone) ?: $phone;

        if (strlen($normalized) === 12 && Str::startsWith($normalized, '57')) {
            return substr($normalized, 2);
        }

        return $normalized;
    }
}
