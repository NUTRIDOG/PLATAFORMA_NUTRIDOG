<?php

use App\Http\Controllers\EbookCheckoutController;
use App\Http\Controllers\PlatformController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [PlatformController::class, 'landing'])->name('landing.index');
Route::get('/ebooks/{slug}', [PlatformController::class, 'ebookShare'])->name('ebooks.share');
Route::get('/ofertas/compra-1-llevate-todos', [PlatformController::class, 'bundleOffer'])->name('offers.bundle');
Route::post('/ebooks/{slug}/checkout', [EbookCheckoutController::class, 'create'])->name('ebooks.checkout.create');
Route::post('/ebooks/{slug}/checkout/{reference}/sync', [EbookCheckoutController::class, 'sync'])->name('ebooks.checkout.sync');
Route::post('/webhooks/wompi', [EbookCheckoutController::class, 'webhook'])->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])->name('webhooks.wompi');
Route::get('/app', function (Request $request) {
    return redirect()->route($request->user() ? 'dashboard.index' : 'landing.index');
})->name('app.legacy');
Route::get('/reader-source/{ebook}', [PlatformController::class, 'streamPdf'])->middleware(['auth', 'signed'])->name('reader.pdf');
Route::get('/ebook-cover/{ebook}', [PlatformController::class, 'streamCover'])->name('ebooks.cover');
require __DIR__ . '/auth.php';

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [PlatformController::class, 'dashboard'])->name('dashboard.index');
    Route::get('/library', [PlatformController::class, 'library'])->name('library.index');
    Route::get('/reader/{slug}', [PlatformController::class, 'reader'])->name('reader.show');
    Route::post('/reader-progress/{ebook}', [PlatformController::class, 'updateReadingProgress'])->name('reader.progress');
    Route::get('/profile', fn () => Inertia::render('Profile'))->name('profile.show');
});

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin', [PlatformController::class, 'admin'])->name('admin.index');
    Route::post('/admin/ebooks', [PlatformController::class, 'store'])->name('admin.ebooks.store');
    Route::post('/admin/ebooks/{ebook}', [PlatformController::class, 'update'])->name('admin.ebooks.update');
    Route::delete('/admin/ebooks/{ebook}', [PlatformController::class, 'destroy'])->name('admin.ebooks.destroy');
    Route::post('/admin/users', [PlatformController::class, 'storeUser'])->name('admin.users.store');
    Route::post('/admin/users/{user}', [PlatformController::class, 'updateUser'])->name('admin.users.update');
    Route::delete('/admin/users/{user}', [PlatformController::class, 'destroyUser'])->name('admin.users.destroy');
    Route::post('/admin/combos', [PlatformController::class, 'storeCombo'])->name('admin.combos.store');
    Route::post('/admin/combos/{combo}', [PlatformController::class, 'updateCombo'])->name('admin.combos.update');
    Route::delete('/admin/combos/{combo}', [PlatformController::class, 'destroyCombo'])->name('admin.combos.destroy');
});

Route::get('/access-denied', fn () => Inertia::render('Blocked'))->name('reader.blocked');
