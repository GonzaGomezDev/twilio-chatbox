<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('chat', [\App\Http\Controllers\ChatController::class, 'index'])->name('dashboard');
    Route::get('contacts', [\App\Http\Controllers\ContactController::class, 'index'])->name('contacts.index');
    Route::get('campaigns', [\App\Http\Controllers\CampaignController::class, 'index'])->name('campaigns.index');
    Route::get('campaigns/create', [\App\Http\Controllers\CampaignController::class, 'create'])->name('campaigns.create');
    Route::get('campaigns/{campaign}', [\App\Http\Controllers\CampaignController::class, 'show'])->name('campaigns.show');
    Route::get('test-toast', function () {
        return \Inertia\Inertia::render('test-toast');
    })->name('test-toast');
    Route::get('api-keys', [\App\Http\Controllers\ApiKeyController::class, 'index'])->name('api-keys.index');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
