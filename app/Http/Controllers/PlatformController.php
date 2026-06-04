<?php

namespace App\Http\Controllers;

use App\Http\Controllers\EbookCheckoutController;
use App\Models\Ebook;
use App\Models\EbookCombo;
use App\Models\EbookPurchase;
use App\Models\EbookUserProgress;
use App\Models\User;
use App\Services\PdfTextExtractor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PlatformController extends Controller
{
    public function __construct(
        protected PdfTextExtractor $pdfTextExtractor,
        protected EbookCheckoutController $ebookCheckoutController
    ) {
    }

    public function dashboard(): Response
    {
        $data = $this->platformData();
        $data['seo'] = $this->privateSeo('Dashboard NutriDog', 'Panel privado para gestionar ebooks, accesos y experiencia de lectura.');

        return Inertia::render('Dashboard', $data);
    }

    public function landing(): Response
    {
        $data = $this->platformData();
        $data['seo'] = $this->landingSeo($data['featured'] ?? null);

        return Inertia::render('Dashboard', $data);
    }

    public function library(): Response
    {
        $data = $this->platformData(restrictToOwned: true);
        $data['seo'] = $this->privateSeo('Biblioteca NutriDog', 'Biblioteca privada para acceder a infoproductos de mascotas con lectura protegida.');

        return Inertia::render('Library', $data);
    }

    public function ebookShare(string $slug): Response
    {
        $ebook = Ebook::query()
            ->with('progressEntries')
            ->where('slug', $slug)
            ->firstOrFail();

        $selected = $this->transformEbook($ebook, request()->user()?->id);
        $related = Ebook::query()
            ->whereKeyNot($ebook->id)
            ->latest()
            ->take(3)
            ->get()
            ->map(fn (Ebook $item) => $this->transformEbook($item, request()->user()?->id))
            ->values();
        $purchase = $this->resolvePurchaseForShare($ebook);

        return Inertia::render('EbookShare', [
            'book' => $selected,
            'relatedBooks' => $related,
            'purchase' => $purchase ? $this->ebookCheckoutController->purchasePayload($purchase) : null,
            'wompi' => [
                'enabled' => filled(config('services.wompi.public_key')) && filled(config('services.wompi.integrity_secret')),
            ],
            'seo' => $this->ebookSeo($selected),
        ]);
    }

    public function bundleOffer(): Response
    {
        $ebooks = Ebook::query()
            ->with('progressEntries')
            ->where('status', 'Activo')
            ->latest()
            ->get();

        if ($ebooks->isEmpty()) {
            $data = $this->platformData();

            return Inertia::render('OfferBundle', [
                'offer' => [
                    'headline' => 'Compra 1 ebook y recibe toda la biblioteca',
                    'summary' => 'Activa esta oferta especial para desbloquear todos los ebooks de por vida.',
                    'primaryBook' => $data['featured'],
                    'giftBooks' => [],
                    'allBooks' => $data['ebooks'],
                    'inventoryReady' => false,
                    'ctaCheckoutUrl' => null,
                    'syncCheckoutUrlTemplate' => null,
                    'offerCode' => 'bundle-lifetime',
                ],
                'purchase' => null,
                'wompi' => [
                    'enabled' => filled(config('services.wompi.public_key')) && filled(config('services.wompi.integrity_secret')),
                ],
                'seo' => $this->offerSeo($data['featured']),
            ]);
        }

        $primary = $ebooks->firstWhere('is_featured', true) ?? $ebooks->first();
        $primaryBook = $this->transformEbook($primary, request()->user()?->id);
        $allBooks = $ebooks->map(fn (Ebook $ebook) => $this->transformEbook($ebook, request()->user()?->id))->values();
        $giftBooks = $allBooks->where('id', '!=', $primaryBook['id'])->values();
        $purchase = $this->resolvePurchaseForShare($primary);

        return Inertia::render('OfferBundle', [
            'offer' => [
                'headline' => 'Compra 1 ebook y te regalamos todos los demas',
                'summary' => 'Pagas solo ' . $primaryBook['price_display'] . ' por ' . $primaryBook['title'] . ' y desbloqueas el resto de la biblioteca para siempre.',
                'primaryBook' => $primaryBook,
                'giftBooks' => $giftBooks,
                'allBooks' => $allBooks,
                'inventoryReady' => true,
                'ctaCheckoutUrl' => route('ebooks.checkout.create', ['slug' => $primaryBook['slug']]),
                'syncCheckoutUrlTemplate' => route('ebooks.checkout.sync', ['slug' => $primaryBook['slug'], 'reference' => '__REFERENCE__']),
                'offerCode' => 'bundle-lifetime',
            ],
            'purchase' => $purchase ? $this->ebookCheckoutController->purchasePayload($purchase) : null,
            'wompi' => [
                'enabled' => filled(config('services.wompi.public_key')) && filled(config('services.wompi.integrity_secret')),
            ],
            'seo' => $this->offerSeo($primaryBook),
        ]);
    }

    public function reader(string $slug): Response
    {
        $ebook = Ebook::query()->where('slug', $slug)->firstOrFail();
        abort_unless($this->canAccessEbook($ebook, request()->user()), 403);
        $data = $this->platformData($ebook);
        $data['seo'] = $this->privateSeo(
            $ebook->title,
            'Lector privado y protegido para acceder a contenido premium dentro de NutriDog.'
        );

        return Inertia::render('Reader', $data);
    }

    public function admin(): Response
    {
        $data = $this->platformData();
        $data['formDefaults'] = $this->emptyForm();

        return Inertia::render('Admin', $data);
    }

    public function streamPdf(Request $request, Ebook $ebook)
    {
        abort_unless($request->hasValidSignature(), 403);
        abort_unless($this->canAccessEbook($ebook, $request->user()), 403);
        abort_unless($ebook->source_type === 'pdf' && $ebook->file_path, 404);
        abort_unless(Storage::disk('local')->exists($ebook->file_path), 404);

        return response()->file(Storage::disk('local')->path($ebook->file_path), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . ($ebook->file_name ?: $ebook->slug . '.pdf') . '"',
            'X-Frame-Options' => 'SAMEORIGIN',
            'Cache-Control' => 'private, max-age=300',
        ]);
    }

    public function streamCover(Ebook $ebook)
    {
        abort_unless($ebook->cover_image_path, 404);
        $disk = Storage::disk('public')->exists($ebook->cover_image_path) ? 'public' : 'local';
        abort_unless(Storage::disk($disk)->exists($ebook->cover_image_path), 404);

        return response()->file(Storage::disk($disk)->path($ebook->cover_image_path), [
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    public function updateReadingProgress(Request $request, Ebook $ebook)
    {
        abort_unless($this->canAccessEbook($ebook, $request->user()), 403);

        $data = $request->validate([
            'progress' => ['required', 'integer', 'min:0', 'max:100'],
            'last_page' => ['required', 'integer', 'min:1'],
        ]);

        $entry = EbookUserProgress::query()->updateOrCreate(
            [
                'ebook_id' => $ebook->id,
                'user_id' => $request->user()->id,
            ],
            [
                'progress' => $data['progress'],
                'last_page' => min($data['last_page'], max($ebook->total_pages, 1)),
                'last_read_at' => now(),
            ]
        );

        return response()->json([
            'progress' => $entry->progress,
            'last_page' => $entry->last_page,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatePayload($request);
        $ebook = new Ebook();

        $this->fillEbook($ebook, $data, $request);

        return redirect()->route('admin.index');
    }

    public function update(Request $request, Ebook $ebook): RedirectResponse
    {
        $data = $this->validatePayload($request, $ebook);

        $this->fillEbook($ebook, $data, $request);

        return redirect()->route('admin.index');
    }

    public function destroy(Ebook $ebook): RedirectResponse
    {
        if ($ebook->file_path) {
            Storage::disk('local')->delete($ebook->file_path);
        }

        if ($ebook->cover_image_path) {
            $this->deleteCoverImage($ebook->cover_image_path);
        }

        $ebook->delete();

        return redirect()->route('admin.index');
    }

    public function storeUser(Request $request): RedirectResponse
    {
        $data = $this->validateUserPayload($request);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $user->syncRoles($data['roles']);
        $user->syncPermissions($data['permissions']);

        return redirect()->route('admin.index');
    }

    public function updateUser(Request $request, User $user): RedirectResponse
    {
        $data = $this->validateUserPayload($request, $user);

        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
        ];

        if (! empty($data['password'])) {
            $payload['password'] = Hash::make($data['password']);
        }

        $user->update($payload);
        $user->syncRoles($data['roles']);
        $user->syncPermissions($data['permissions']);

        return redirect()->route('admin.index');
    }

    public function destroyUser(Request $request, User $user): RedirectResponse
    {
        abort_if($request->user()->is($user), 422, 'No puedes eliminar tu propia cuenta.');

        $user->delete();

        return redirect()->route('admin.index');
    }

    public function storeCombo(Request $request): RedirectResponse
    {
        $data = $this->validateComboPayload($request);
        $combo = new EbookCombo();

        $this->fillCombo($combo, $data);

        return redirect()->route('admin.index');
    }

    public function updateCombo(Request $request, EbookCombo $combo): RedirectResponse
    {
        $data = $this->validateComboPayload($request, $combo);

        $this->fillCombo($combo, $data);

        return redirect()->route('admin.index');
    }

    public function destroyCombo(EbookCombo $combo): RedirectResponse
    {
        $combo->delete();

        return redirect()->route('admin.index');
    }

    protected function fillEbook(Ebook $ebook, array $data, Request $request): void
    {
        $sourceType = $data['source_type'];
        $slug = Str::slug($data['title']);
        $coverSeed = preg_replace('/[^A-Za-z0-9]/', '', $data['title']) ?: $data['title'];
        $cover = $data['cover'] ?: Str::upper(Str::substr($coverSeed, 0, 2));
        $coverImagePath = $this->resolveCoverImagePath($request, $ebook);
        $htmlContent = $sourceType === 'html' ? $this->resolveHtmlContent($request, $data, $ebook) : null;
        $filePath = $sourceType === 'pdf' ? $this->resolvePdfPath($request, $ebook) : null;
        $fileName = $sourceType === 'pdf'
            ? ($request->file('pdf_file')?->getClientOriginalName() ?: $ebook->file_name)
            : null;
        $extracted = $sourceType === 'pdf' && $filePath
            ? $this->pdfTextExtractor->extract(Storage::disk('local')->path($filePath))
            : ['text' => '', 'page_count' => 1];

        if ($sourceType === 'html' && $ebook->file_path) {
            Storage::disk('local')->delete($ebook->file_path);
        }

        if ($data['is_featured']) {
            Ebook::query()->where('id', '!=', $ebook->id)->update(['is_featured' => false]);
        }

        $ebook->fill([
            'user_id' => $request->user()?->id,
            'title' => $data['title'],
            'slug' => $slug,
            'author' => $data['author'],
            'category' => $data['category'],
            'cover' => $cover,
            'cover_image_path' => $coverImagePath,
            'access' => $data['access'],
            'status' => $data['status'],
            'format' => $sourceType === 'pdf' ? 'PDF convertido' : 'HTML interactivo',
            'source_type' => $sourceType,
            'protection' => $data['protection'],
            'primary_color' => $data['primary_color'],
            'secondary_color' => $data['secondary_color'],
            'description' => $data['description'],
            'price_in_cents' => (int) $data['price_in_cents'],
            'html_content' => $htmlContent,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'extracted_text' => $sourceType === 'pdf' ? $extracted['text'] : null,
            'progress' => (int) $data['progress'],
            'last_page' => max((int) $data['last_page'], 1),
            'total_pages' => $sourceType === 'pdf' ? max($extracted['page_count'], 1) : max((int) $data['total_pages'], 1),
            'offline' => $request->boolean('offline'),
            'is_featured' => $request->boolean('is_featured'),
            'published_at' => now(),
        ]);

        $ebook->save();
    }

    protected function fillCombo(EbookCombo $combo, array $data): void
    {
        $combo->fill([
            'title' => $data['title'],
            'slug' => $this->uniqueSlug(EbookCombo::class, $data['title'], $combo->id),
            'description' => $data['description'] ?? null,
            'access' => $data['access'],
            'status' => $data['status'],
        ]);

        $combo->save();

        $combo->ebooks()->sync(
            collect($data['ebook_ids'])
                ->values()
                ->mapWithKeys(fn ($ebookId, $index) => [$ebookId => ['sort_order' => $index]])
                ->all()
        );
    }

    protected function resolveHtmlContent(Request $request, array $data, Ebook $ebook): ?string
    {
        $htmlFile = $request->file('html_file');

        if ($htmlFile) {
            return $htmlFile->get();
        }

        if (! empty($data['html_content'])) {
            return $data['html_content'];
        }

        return $ebook->html_content;
    }

    protected function resolvePdfPath(Request $request, Ebook $ebook): ?string
    {
        $pdfFile = $request->file('pdf_file');

        if (! $pdfFile) {
            return $ebook->file_path;
        }

        if ($ebook->file_path) {
            Storage::disk('local')->delete($ebook->file_path);
        }

        return $pdfFile->store('ebooks/pdfs', 'local');
    }

    protected function resolveCoverImagePath(Request $request, Ebook $ebook): ?string
    {
        $coverImage = $request->file('cover_image');

        if (! $coverImage) {
            return $ebook->cover_image_path;
        }

        if ($ebook->cover_image_path) {
            $this->deleteCoverImage($ebook->cover_image_path);
        }

        return $this->storeWebpCover(
            $coverImage,
            $request->input('title') ?: $ebook->title ?: 'ebook-cover'
        );
    }

    protected function storeWebpCover($coverImage, string $title): string
    {
        if (! function_exists('imagecreatefromstring') || ! function_exists('imagewebp')) {
            throw ValidationException::withMessages([
                'cover_image' => 'El servidor no tiene soporte para convertir imagenes a WebP.',
            ]);
        }

        $binary = file_get_contents($coverImage->getRealPath());
        $image = $binary !== false ? @imagecreatefromstring($binary) : false;

        if (! $image) {
            throw ValidationException::withMessages([
                'cover_image' => 'No pudimos procesar la portada seleccionada.',
            ]);
        }

        if (function_exists('imagepalettetotruecolor')) {
            imagepalettetotruecolor($image);
        }

        imagealphablending($image, true);
        imagesavealpha($image, true);

        ob_start();
        $converted = imagewebp($image, null, 82);
        $webpBinary = ob_get_clean();
        imagedestroy($image);

        if (! $converted || $webpBinary === false) {
            throw ValidationException::withMessages([
                'cover_image' => 'No pudimos comprimir la portada en formato WebP.',
            ]);
        }

        $path = 'ebooks/covers/' . Str::slug($title ?: 'ebook-cover') . '-' . Str::uuid() . '.webp';
        Storage::disk('public')->put($path, $webpBinary);

        return $path;
    }

    protected function deleteCoverImage(string $path): void
    {
        Storage::disk('public')->delete($path);
        Storage::disk('local')->delete($path);
    }

    protected function validatePayload(Request $request, ?Ebook $ebook = null): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'cover' => ['nullable', 'string', 'max:8'],
            'cover_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'access' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'max:255'],
            'source_type' => ['required', Rule::in(['html', 'pdf'])],
            'protection' => ['required', 'string', 'max:255'],
            'primary_color' => ['required', 'string', 'size:7'],
            'secondary_color' => ['required', 'string', 'size:7'],
            'description' => ['required', 'string'],
            'price_in_cents' => ['required', 'integer', 'min:0'],
            'html_content' => ['nullable', 'string'],
            'html_file' => ['nullable', 'file', 'mimes:html,htm,txt'],
            'pdf_file' => ['nullable', 'file', 'mimes:pdf', 'max:51200'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'last_page' => ['nullable', 'integer', 'min:1'],
            'total_pages' => ['nullable', 'integer', 'min:1'],
            'offline' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
        ]);

        if ($data['source_type'] === 'html' && empty($data['html_content']) && ! $request->hasFile('html_file') && ! $ebook?->html_content) {
            $request->validate([
                'html_content' => ['required_without:html_file'],
            ]);
        }

        if ($data['source_type'] === 'pdf' && ! $request->hasFile('pdf_file') && ! $ebook?->file_path) {
            $request->validate([
                'pdf_file' => ['required'],
            ]);
        }

        $data['progress'] = $data['progress'] ?? 0;
        $data['last_page'] = $data['last_page'] ?? 1;
        $data['total_pages'] = $data['total_pages'] ?? 1;

        return $data;
    }

    protected function validateUserPayload(Request $request, ?User $user = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user?->id),
            ],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:8'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', Rule::exists('roles', 'name')],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')],
        ]);

        $data['roles'] = $data['roles'] ?? [];
        $data['permissions'] = $data['permissions'] ?? [];

        return $data;
    }

    protected function validateComboPayload(Request $request, ?EbookCombo $combo = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'access' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'max:255'],
            'ebook_ids' => ['required', 'array', 'min:1'],
            'ebook_ids.*' => ['integer', Rule::exists('ebooks', 'id')],
        ]);
    }

    protected function platformData(?Ebook $selected = null, bool $restrictToOwned = false): array
    {
        $ebooksQuery = Ebook::query()
            ->with('progressEntries')
            ->latest();

        if ($restrictToOwned && ! $this->canManage()) {
            $ownedIds = request()->user()?->ebooks()->pluck('ebooks.id') ?? collect();
            $ebooksQuery->whereIn('id', $ownedIds);
        }

        $ebooks = $ebooksQuery->get();
        $combos = EbookCombo::query()->with('ebooks')->latest()->get();
        $users = User::query()->with('roles', 'permissions')->latest()->get();
        $roles = Role::query()->orderBy('name')->pluck('name');
        $permissions = Permission::query()->orderBy('name')->pluck('name');

        if ($ebooks->isEmpty()) {
            $fallback = collect($this->fallbackEbooks())->map(fn (array $ebook) => (object) $ebook);

            return [
                'featured' => $fallback->first(),
                'ebooks' => $fallback->values(),
                'selected' => $selected ? $this->transformEbook($selected) : $fallback->first(),
                'metrics' => $this->metrics(collect()),
                'events' => $this->events(),
                'pipeline' => $this->pipeline(),
                'security' => $this->security(),
                'uploads' => [],
                'chapters' => collect([
                    'Introduccion y contexto',
                    'Bases de nutricion funcional',
                    'Macronutrientes y digestibilidad',
                    'Planificacion de menus',
                    'Seguimiento, progreso y ajustes',
                ]),
                'readerPages' => [],
                'editingItems' => [],
                'users' => [],
                'editingUsers' => [],
                'roleOptions' => $roles->values(),
                'permissionOptions' => $permissions->values(),
                'userFormDefaults' => $this->emptyUserForm(),
                'combos' => [],
                'editingCombos' => [],
                'comboFormDefaults' => $this->emptyComboForm(),
            ];
        }

        $user = request()->user();
        $transformed = $ebooks->map(fn (Ebook $ebook) => $this->transformEbook($ebook, $user?->id));
        $featured = $transformed->firstWhere('is_featured', true) ?? $transformed->first();
        $selectedBook = $selected ? $this->transformEbook($selected->loadMissing('progressEntries'), $user?->id) : $featured;

        return [
            'featured' => $featured,
            'ebooks' => $transformed->values(),
            'selected' => $selectedBook,
            'metrics' => $this->metrics($ebooks),
            'events' => $this->events(),
            'pipeline' => $this->pipeline(),
            'security' => $this->security(),
            'uploads' => $this->uploads($ebooks),
            'chapters' => collect($this->chapters($selected ?? $ebooks->first())),
            'readerPages' => $this->readerPages($selected ?? $ebooks->first()),
            'editingItems' => $ebooks->map(fn (Ebook $ebook) => $this->editingPayload($ebook))->values(),
            'users' => $users->map(fn (User $adminUser) => $this->transformUser($adminUser))->values(),
            'editingUsers' => $users->map(fn (User $adminUser) => $this->editingUserPayload($adminUser))->values(),
            'roleOptions' => $roles->values(),
            'permissionOptions' => $permissions->values(),
            'userFormDefaults' => $this->emptyUserForm(),
            'combos' => $combos->map(fn (EbookCombo $combo) => $this->transformCombo($combo))->values(),
            'editingCombos' => $combos->map(fn (EbookCombo $combo) => $this->editingComboPayload($combo))->values(),
            'comboFormDefaults' => $this->emptyComboForm(),
        ];
    }

    protected function transformEbook(object $ebook, ?int $userId = null): array
    {
        $userProgress = null;

        if ($userId && isset($ebook->progressEntries)) {
            $userProgress = $ebook->progressEntries->firstWhere('user_id', $userId);
        }

        $progress = $userProgress?->progress ?? $ebook->progress;
        $lastPage = $userProgress?->last_page ?? $ebook->last_page;

        return [
            'id' => $ebook->id,
            'title' => $ebook->title,
            'slug' => $ebook->slug,
            'author' => $ebook->author,
            'description' => $ebook->description,
            'price_in_cents' => (int) ($ebook->price_in_cents ?? 0),
            'price_display' => $this->formatPrice((int) ($ebook->price_in_cents ?? 0)),
            'cover' => $ebook->cover,
            'cover_image_url' => $this->coverImageUrlForEbook($ebook),
            'category' => $ebook->category,
            'access' => $ebook->access,
            'has_access' => $userId ? $this->userOwnsEbook($userId, (int) $ebook->id) : false,
            'progress' => $progress,
            'last_page' => $lastPage,
            'total_pages' => $ebook->total_pages,
            'offline' => (bool) $ebook->offline,
            'status' => $ebook->status,
            'primary_color' => $ebook->primary_color,
            'secondary_color' => $ebook->secondary_color,
            'format' => $ebook->format,
            'source_type' => $ebook->source_type,
            'protection' => $ebook->protection,
            'is_featured' => (bool) ($ebook->is_featured ?? false),
            'file_name' => $ebook->file_name ?? null,
            'share_url' => route('ebooks.share', ['slug' => $ebook->slug]),
            'reader_url' => route('reader.show', ['slug' => $ebook->slug]),
            'pdf_url' => ($ebook->source_type ?? null) === 'pdf' && ! empty($ebook->file_path)
                ? URL::temporarySignedRoute('reader.pdf', now()->addHours(2), ['ebook' => $ebook->id])
                : null,
            'progress_endpoint' => route('reader.progress', ['ebook' => $ebook->id]),
        ];
    }

    protected function editingPayload(Ebook $ebook): array
    {
        return [
            'id' => $ebook->id,
            'title' => $ebook->title,
            'author' => $ebook->author,
            'category' => $ebook->category,
            'cover' => $ebook->cover,
            'cover_image_url' => $this->coverImageUrlForEbook($ebook),
            'access' => $ebook->access,
            'status' => $ebook->status,
            'source_type' => $ebook->source_type,
            'protection' => $ebook->protection,
            'primary_color' => $ebook->primary_color,
            'secondary_color' => $ebook->secondary_color,
            'description' => $ebook->description,
            'price_in_cents' => (int) $ebook->price_in_cents,
            'html_content' => $ebook->html_content,
            'progress' => $ebook->progress,
            'last_page' => $ebook->last_page,
            'total_pages' => $ebook->total_pages,
            'offline' => $ebook->offline,
            'is_featured' => $ebook->is_featured,
            'file_name' => $ebook->file_name,
        ];
    }

    protected function transformUser(User $user): array
    {
        $roles = $user->getRoleNames()->values();
        $permissions = $user->getDirectPermissions()->pluck('name')->values();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $roles,
            'permissions' => $permissions,
            'role_count' => $roles->count(),
            'permission_count' => $permissions->count(),
        ];
    }

    protected function editingUserPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->getRoleNames()->values()->all(),
            'permissions' => $user->getDirectPermissions()->pluck('name')->values()->all(),
        ];
    }

    protected function transformCombo(EbookCombo $combo): array
    {
        return [
            'id' => $combo->id,
            'title' => $combo->title,
            'slug' => $combo->slug,
            'description' => $combo->description,
            'access' => $combo->access,
            'status' => $combo->status,
            'ebook_count' => $combo->ebooks->count(),
            'ebooks' => $combo->ebooks->map(fn (Ebook $ebook) => [
                'id' => $ebook->id,
                'title' => $ebook->title,
            ])->values(),
        ];
    }

    protected function editingComboPayload(EbookCombo $combo): array
    {
        return [
            'id' => $combo->id,
            'title' => $combo->title,
            'description' => $combo->description,
            'access' => $combo->access,
            'status' => $combo->status,
            'ebook_ids' => $combo->ebooks->pluck('id')->values()->all(),
        ];
    }

    protected function metrics($ebooks): array
    {
        $count = $ebooks->count();
        $inProgress = $ebooks->where('progress', '>', 0)->count();
        $protected = $ebooks->where('source_type', 'pdf')->count();
        $offline = $count > 0 ? round(($ebooks->where('offline', true)->count() / $count) * 100) : 0;

        return [
            ['label' => 'Ebooks activos', 'value' => (string) $count, 'detail' => 'Catalogo publicado'],
            ['label' => 'Lecturas en curso', 'value' => (string) $inProgress, 'detail' => 'Con progreso registrado'],
            ['label' => 'PDFs convertidos', 'value' => (string) $protected, 'detail' => 'Listos para lector'],
            ['label' => 'Offline sincronizado', 'value' => $offline . '%', 'detail' => 'Marcados para acceso rapido'],
        ];
    }

    protected function chapters(?Ebook $ebook): array
    {
        if (! $ebook) {
            return [];
        }

        if ($ebook->source_type === 'pdf') {
            return collect($this->readerPages($ebook))
                ->map(fn (array $page, int $index) => 'Pagina ' . ($page['page'] ?? $index + 1))
                ->values()
                ->all();
        }

        $text = strip_tags($ebook->html_content ?? '');
        $sentences = preg_split('/(?<=[\.\!\?])\s+/', $text) ?: [];

        return collect($sentences)
            ->map(fn (string $sentence, int $index) => Str::limit(trim($sentence), 54, ''))
            ->filter()
            ->take(6)
            ->values()
            ->all();
    }

    protected function readerPages(?Ebook $ebook): array
    {
        if (! $ebook) {
            return [];
        }

        if ($ebook->source_type === 'pdf') {
            $pages = preg_split("/\n\s*\n/", trim((string) $ebook->extracted_text)) ?: [];

            return collect($pages)
                ->filter()
                ->values()
                ->take(8)
                ->map(function (string $page, int $index) {
                    return [
                        'page' => $index + 1,
                        'title' => 'Pagina ' . ($index + 1),
                        'content' => trim($page),
                    ];
                })
                ->all();
        }

        return [
            [
                'page' => 1,
                'title' => 'Contenido HTML',
                'content' => $ebook->html_content ?? '<p>Este ebook no tiene contenido HTML cargado aun.</p>',
            ],
        ];
    }

    protected function uploads($ebooks): array
    {
        return $ebooks
            ->take(5)
            ->map(function (Ebook $ebook) {
                return [
                    'name' => $ebook->file_name ?: ($ebook->slug . '.html'),
                    'type' => Str::upper($ebook->source_type),
                    'stage' => $ebook->status,
                    'audience' => $ebook->category ?: 'Biblioteca general',
                ];
            })
            ->values()
            ->all();
    }

    protected function events(): array
    {
        return [
            ['time' => '10:32', 'event' => 'reader_opened', 'user' => 'Camila Rojas', 'status' => 'Seguro'],
            ['time' => '10:41', 'event' => 'offline_enabled', 'user' => 'David Leon', 'status' => 'Cifrado'],
            ['time' => '10:55', 'event' => 'copy_blocked', 'user' => 'Andrea Mora', 'status' => 'Bloqueado'],
            ['time' => '11:07', 'event' => 'devtools_detected', 'user' => 'Juan Perez', 'status' => 'Revisar'],
        ];
    }

    protected function pipeline(): array
    {
        return [
            [
                'title' => 'Sube HTML o PDF',
                'detail' => 'El admin publica HTML manual o sube PDFs reales para convertirlos a lectura interna.',
            ],
            [
                'title' => 'Guarda y protege',
                'detail' => 'Cada ebook persiste con metadatos, colores, acceso, portada y politica de proteccion.',
            ],
            [
                'title' => 'Entrega en lector',
                'detail' => 'La biblioteca y el reader consumen ese contenido sin exponer descargas directas.',
            ],
        ];
    }

    protected function security(): array
    {
        return [
            ['label' => 'Descarga directa', 'state' => 'Deshabilitada'],
            ['label' => 'Copiar o seleccionar', 'state' => 'Bloqueado'],
            ['label' => 'Visibilidad fuera de foco', 'state' => 'Difuminado'],
            ['label' => 'Marca de agua', 'state' => 'Dinamica'],
            ['label' => 'Checkout Wompi', 'state' => filled(config('services.wompi.public_key')) ? 'Listo' : 'Config pendiente'],
        ];
    }

    protected function emptyForm(): array
    {
        return [
            'title' => '',
            'author' => '',
            'category' => '',
            'cover' => '',
            'cover_image_url' => null,
            'access' => 'De por vida',
            'status' => 'Activo',
            'source_type' => 'html',
            'protection' => 'Blindaje total',
            'primary_color' => '#4316FF',
            'secondary_color' => '#7CC21F',
            'description' => '',
            'price_in_cents' => 49000,
            'html_content' => '<section><h2>Nuevo ebook</h2><p>Escribe aqui tu contenido HTML.</p></section>',
            'progress' => 0,
            'last_page' => 1,
            'total_pages' => 1,
            'offline' => false,
            'is_featured' => false,
            'file_name' => null,
        ];
    }

    protected function emptyUserForm(): array
    {
        return [
            'name' => '',
            'email' => '',
            'password' => '',
            'roles' => [],
            'permissions' => [],
        ];
    }

    protected function emptyComboForm(): array
    {
        return [
            'title' => '',
            'description' => '',
            'access' => 'Premium',
            'status' => 'Activo',
            'ebook_ids' => [],
        ];
    }

    protected function uniqueSlug(string $modelClass, string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $counter = 2;

        while ($modelClass::query()
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = $base . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    protected function fallbackEbooks(): array
    {
        return [
            [
                'id' => 1,
                'title' => 'Guia NutriDog Premium',
                'slug' => 'guia-nutridog-premium',
                'author' => 'Equipo NutriDog',
                'description' => 'Plan maestro de alimentacion, salud digestiva y rutinas para perros de alto rendimiento.',
                'price_in_cents' => 89000,
                'price_display' => $this->formatPrice(89000),
                'cover' => 'ND',
                'cover_image_url' => null,
                'category' => 'Nutricion avanzada',
                'access' => 'De por vida',
                'progress' => 78,
                'last_page' => 94,
                'total_pages' => 120,
                'offline' => true,
                'status' => 'Activo',
                'primary_color' => '#4316FF',
                'secondary_color' => '#7CC21F',
                'format' => 'HTML interactivo',
                'source_type' => 'html',
                'protection' => 'Blindaje total',
                'is_featured' => true,
                'has_access' => false,
                'share_url' => route('ebooks.share', ['slug' => 'guia-nutridog-premium']),
                'reader_url' => route('reader.show', ['slug' => 'guia-nutridog-premium']),
            ],
        ];
    }

    protected function landingSeo(array|object|null $featured = null): array
    {
        $title = 'NutriDog | Plataforma para vender infoproductos de mascotas';
        $description = 'Presenta, protege y comparte ebooks y guías digitales para el cuidado de mascotas con una landing profesional, biblioteca privada y lector seguro.';
        $image = $this->absoluteUrl(data_get($featured, 'cover_image_url', '/images/ebooks.webp'));

        return $this->seoPayload(
            title: $title,
            description: $description,
            canonical: route('landing.index'),
            image: $image,
            imageAlt: 'Landing principal de NutriDog',
            type: 'website',
            robots: 'index,follow',
            structuredData: [
                [
                    '@context' => 'https://schema.org',
                    '@type' => 'WebSite',
                    'name' => 'NutriDog',
                    'url' => route('landing.index'),
                    'description' => $description,
                ],
                [
                    '@context' => 'https://schema.org',
                    '@type' => 'Organization',
                    'name' => 'NutriDog',
                    'url' => route('landing.index'),
                    'logo' => $this->absoluteUrl('/images/logo.webp'),
                ],
            ],
        );
    }

    protected function offerSeo(array|object|null $primaryBook = null): array
    {
        $title = 'Oferta NutriDog | Compra 1 ebook y recibe toda la biblioteca';
        $description = 'Landing publica de oferta: compras un ebook principal y desbloqueas el resto de la biblioteca digital con acceso de por vida.';
        $image = $this->absoluteUrl(data_get($primaryBook, 'cover_image_url', '/images/ebooks.webp'));

        return $this->seoPayload(
            title: $title,
            description: $description,
            canonical: route('offers.bundle'),
            image: $image,
            imageAlt: 'Oferta publica de NutriDog',
            type: 'website',
            robots: 'index,follow',
            structuredData: [
                [
                    '@context' => 'https://schema.org',
                    '@type' => 'Offer',
                    'name' => $title,
                    'description' => $description,
                    'url' => route('offers.bundle'),
                    'priceCurrency' => 'COP',
                    'category' => 'Ebooks digitales',
                ],
            ],
        );
    }

    protected function ebookSeo(array $ebook): array
    {
        $title = $ebook['title'] . ' | Ebook de mascotas | NutriDog';
        $description = Str::limit(
            trim((string) ($ebook['description'] ?? 'Descubre un infoproducto digital de NutriDog para el cuidado de tus mascotas.')),
            160,
            ''
        );
        $canonical = route('ebooks.share', ['slug' => $ebook['slug']]);
        $image = $this->absoluteUrl($ebook['cover_image_url'] ?? '/images/ebooks.webp');

        return $this->seoPayload(
            title: $title,
            description: $description,
            canonical: $canonical,
            image: $image,
            imageAlt: 'Portada de ' . $ebook['title'],
            type: 'article',
            robots: 'index,follow',
            structuredData: [
                [
                    '@context' => 'https://schema.org',
                    '@type' => 'Book',
                    'name' => $ebook['title'],
                    'description' => $description,
                    'url' => $canonical,
                    'image' => $image,
                    'author' => [
                        '@type' => 'Organization',
                        'name' => $ebook['author'] ?: 'Equipo NutriDog',
                    ],
                    'publisher' => [
                        '@type' => 'Organization',
                        'name' => 'NutriDog',
                        'logo' => [
                            '@type' => 'ImageObject',
                            'url' => $this->absoluteUrl('/images/logo.webp'),
                        ],
                    ],
                    'bookFormat' => strtoupper((string) ($ebook['source_type'] ?? 'html')) === 'PDF'
                        ? 'https://schema.org/EBook'
                        : 'https://schema.org/EBook',
                    'about' => $ebook['category'] ?? 'Cuidado de mascotas',
                ],
            ],
        );
    }

    protected function privateSeo(string $title, string $description): array
    {
        return $this->seoPayload(
            title: $title,
            description: $description,
            canonical: request()->fullUrl(),
            image: $this->absoluteUrl('/images/logo.webp'),
            imageAlt: $title,
            type: 'website',
            robots: 'noindex,nofollow'
        );
    }

    protected function seoPayload(
        string $title,
        string $description,
        string $canonical,
        string $image,
        string $imageAlt,
        string $type,
        string $robots,
        array $structuredData = []
    ): array {
        return [
            'title' => $title,
            'description' => $description,
            'canonical' => $canonical,
            'image' => $image,
            'image_alt' => $imageAlt,
            'type' => $type,
            'robots' => $robots,
            'site_name' => config('app.name', 'NutriDog'),
            'locale' => 'es_CO',
            'twitter_card' => 'summary_large_image',
            'structured_data' => $structuredData,
        ];
    }

    protected function absoluteUrl(?string $path): string
    {
        if (! $path) {
            return url('/images/ebooks.webp');
        }

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        return url($path);
    }

    protected function coverImageUrlForEbook(object $ebook): ?string
    {
        if (! $ebook->cover_image_path) {
            return null;
        }

        if (Storage::disk('public')->exists($ebook->cover_image_path)) {
            return '/storage/' . ltrim($ebook->cover_image_path, '/');
        }

        if (Storage::disk('local')->exists($ebook->cover_image_path)) {
            return route('ebooks.cover', ['ebook' => $ebook->id]);
        }

        return null;
    }

    protected function canManage(?User $user = null): bool
    {
        $user ??= request()->user();

        return (bool) $user?->hasAnyRole(['admin', 'editor']);
    }

    protected function canAccessEbook(Ebook $ebook, ?User $user): bool
    {
        if (! $user) {
            return false;
        }

        if ($this->canManage($user)) {
            return true;
        }

        return $user->ebooks()->whereKey($ebook->id)->exists();
    }

    protected function userOwnsEbook(int $userId, int $ebookId): bool
    {
        $user = request()->user();

        if ($user && $user->id === $userId && $this->canManage($user)) {
            return true;
        }

        return User::query()
            ->whereKey($userId)
            ->whereHas('ebooks', fn ($query) => $query->whereKey($ebookId))
            ->exists();
    }

    protected function resolvePurchaseForShare(Ebook $ebook): ?EbookPurchase
    {
        $reference = request()->query('purchase');

        if (! $reference) {
            return null;
        }

        $purchase = EbookPurchase::query()
            ->where('ebook_id', $ebook->id)
            ->where('reference', $reference)
            ->first();

        if (! $purchase) {
            return null;
        }

        $transactionId = request()->query('id');

        if ($transactionId) {
            try {
                $purchase = $this->ebookCheckoutController->syncPurchaseByTransactionId($purchase, (string) $transactionId);
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return $purchase;
    }

    protected function formatPrice(int $amountInCents): string
    {
        return '$' . number_format($amountInCents, 0, ',', '.');
    }
}
