<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ebook_combos', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('access')->default('De por vida');
            $table->string('status')->default('Activo');
            $table->timestamps();
        });

        Schema::create('combo_ebook', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ebook_combo_id')->constrained('ebook_combos')->cascadeOnDelete();
            $table->foreignId('ebook_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->unique(['ebook_combo_id', 'ebook_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('combo_ebook');
        Schema::dropIfExists('ebook_combos');
    }
};
