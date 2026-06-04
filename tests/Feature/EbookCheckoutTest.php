<?php

namespace Tests\Feature;

use App\Http\Controllers\EbookCheckoutController;
use App\Mail\EbookPurchaseAccessMail;
use App\Models\Ebook;
use App\Models\EbookPurchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class EbookCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_prepare_a_wompi_checkout_for_an_ebook(): void
    {
        Role::create(['name' => 'reader', 'guard_name' => 'web']);

        config()->set('services.wompi.public_key', 'pub_test_demo');
        config()->set('services.wompi.integrity_secret', 'int_test_demo');

        $ebook = $this->makeEbook();

        $response = $this->postJson(route('ebooks.checkout.create', ['slug' => $ebook->slug]), [
            'name' => 'Ana Gomez',
            'email' => 'ana@example.com',
            'phone' => '3001234567',
        ]);

        $response->assertOk()
            ->assertJsonPath('checkout.publicKey', 'pub_test_demo')
            ->assertJsonPath('checkout.amountInCents', 89000);

        $this->assertDatabaseHas('ebook_purchases', [
            'ebook_id' => $ebook->id,
            'purchaser_email' => 'ana@example.com',
            'wompi_status' => 'PENDING',
        ]);
    }

    public function test_guest_can_claim_a_free_ebook_without_wompi(): void
    {
        Mail::fake();

        Role::create(['name' => 'reader', 'guard_name' => 'web']);

        $ebook = $this->makeEbook([
            'price_in_cents' => 0,
        ]);

        $response = $this->postJson(route('ebooks.checkout.create', ['slug' => $ebook->slug]), [
            'name' => 'Ana Gratis',
            'email' => 'ana-gratis@example.com',
            'phone' => '3001234567',
        ]);

        $response->assertOk()
            ->assertJsonPath('direct_access', true)
            ->assertJsonPath('purchase.status', 'APPROVED');

        $user = User::query()->where('email', 'ana-gratis@example.com')->first();

        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('reader'));
        $this->assertDatabaseHas('ebook_user', [
            'ebook_id' => $ebook->id,
            'user_id' => $user->id,
        ]);
        $this->assertDatabaseHas('ebook_purchases', [
            'ebook_id' => $ebook->id,
            'user_id' => $user->id,
            'amount_in_cents' => 0,
            'wompi_status' => 'APPROVED',
        ]);

        Mail::assertSent(EbookPurchaseAccessMail::class, fn (EbookPurchaseAccessMail $mail) => $mail->hasTo('ana-gratis@example.com'));
    }

    public function test_approved_transaction_creates_reader_user_grants_access_and_sends_mail(): void
    {
        Mail::fake();

        Role::create(['name' => 'reader', 'guard_name' => 'web']);

        config()->set('services.wompi.public_key', 'pub_test_demo');
        config()->set('services.wompi.integrity_secret', 'int_test_demo');
        config()->set('services.wompi.base_url', 'https://sandbox.wompi.co');

        $ebook = $this->makeEbook();
        $purchase = EbookPurchase::create([
            'ebook_id' => $ebook->id,
            'purchaser_name' => 'Ana Gomez',
            'purchaser_email' => 'ana@example.com',
            'purchaser_phone' => '3001234567',
            'amount_in_cents' => 89000,
            'currency' => 'COP',
            'reference' => 'NUTRI-TEST-001',
            'wompi_status' => 'PENDING',
        ]);

        Http::fake([
            'https://sandbox.wompi.co/v1/transactions/*' => Http::response([
                'data' => [
                    'id' => 'tx-test-123',
                    'reference' => 'NUTRI-TEST-001',
                    'status' => 'APPROVED',
                    'status_message' => 'Pago aprobado',
                    'amount_in_cents' => 89000,
                    'currency' => 'COP',
                ],
            ], 200),
        ]);

        app(EbookCheckoutController::class)->syncPurchaseByTransactionId($purchase, 'tx-test-123');

        $user = User::query()->where('email', 'ana@example.com')->first();

        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('reader'));
        $this->assertDatabaseHas('ebook_user', [
            'ebook_id' => $ebook->id,
            'user_id' => $user->id,
        ]);
        $this->assertDatabaseHas('ebook_purchases', [
            'id' => $purchase->id,
            'user_id' => $user->id,
            'wompi_status' => 'APPROVED',
        ]);

        Mail::assertSent(EbookPurchaseAccessMail::class, fn (EbookPurchaseAccessMail $mail) => $mail->hasTo('ana@example.com'));
    }

    public function test_bundle_offer_purchase_grants_all_active_ebooks(): void
    {
        Mail::fake();

        Role::create(['name' => 'reader', 'guard_name' => 'web']);

        config()->set('services.wompi.public_key', 'pub_test_demo');
        config()->set('services.wompi.integrity_secret', 'int_test_demo');
        config()->set('services.wompi.base_url', 'https://sandbox.wompi.co');

        $mainEbook = $this->makeEbook();
        $giftEbook = Ebook::create([
            'title' => 'Recetario Funcional Canino',
            'slug' => 'recetario-funcional-canino',
            'author' => 'Equipo NutriDog',
            'category' => 'Recetas',
            'cover' => 'RF',
            'access' => 'De por vida',
            'status' => 'Activo',
            'format' => 'HTML interactivo',
            'source_type' => 'html',
            'protection' => 'Blindaje total',
            'primary_color' => '#1E293B',
            'secondary_color' => '#7CC21F',
            'description' => 'Segundo ebook de prueba',
            'price_in_cents' => 69000,
            'html_content' => '<section><h2>Gift</h2></section>',
            'progress' => 0,
            'last_page' => 1,
            'total_pages' => 10,
            'offline' => false,
            'is_featured' => false,
            'published_at' => now(),
        ]);

        $purchase = EbookPurchase::create([
            'ebook_id' => $mainEbook->id,
            'purchaser_name' => 'Ana Gomez',
            'purchaser_email' => 'ana-bundle@example.com',
            'purchaser_phone' => '3001234567',
            'amount_in_cents' => 89000,
            'currency' => 'COP',
            'reference' => 'NUTRI-BUNDLE-001',
            'grant_all_ebooks' => true,
            'offer_code' => 'bundle-lifetime',
            'wompi_status' => 'PENDING',
        ]);

        Http::fake([
            'https://sandbox.wompi.co/v1/transactions/*' => Http::response([
                'data' => [
                    'id' => 'tx-bundle-123',
                    'reference' => 'NUTRI-BUNDLE-001',
                    'status' => 'APPROVED',
                    'status_message' => 'Pago aprobado',
                    'amount_in_cents' => 89000,
                    'currency' => 'COP',
                ],
            ], 200),
        ]);

        app(EbookCheckoutController::class)->syncPurchaseByTransactionId($purchase, 'tx-bundle-123');

        $user = User::query()->where('email', 'ana-bundle@example.com')->firstOrFail();

        $this->assertDatabaseHas('ebook_user', [
            'ebook_id' => $mainEbook->id,
            'user_id' => $user->id,
        ]);
        $this->assertDatabaseHas('ebook_user', [
            'ebook_id' => $giftEbook->id,
            'user_id' => $user->id,
        ]);
    }

    protected function makeEbook(array $overrides = []): Ebook
    {
        return Ebook::create(array_merge([
            'title' => 'Guia NutriDog Premium',
            'slug' => 'guia-nutridog-premium',
            'author' => 'Equipo NutriDog',
            'category' => 'Nutricion avanzada',
            'cover' => 'ND',
            'access' => 'De por vida',
            'status' => 'Activo',
            'format' => 'HTML interactivo',
            'source_type' => 'html',
            'protection' => 'Blindaje total',
            'primary_color' => '#4316FF',
            'secondary_color' => '#7CC21F',
            'description' => 'Descripcion de prueba',
            'price_in_cents' => 89000,
            'html_content' => '<section><h2>Test</h2></section>',
            'progress' => 0,
            'last_page' => 1,
            'total_pages' => 10,
            'offline' => false,
            'is_featured' => true,
            'published_at' => now(),
        ], $overrides));
    }
}
