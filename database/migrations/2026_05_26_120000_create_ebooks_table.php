<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ebooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('author')->nullable();
            $table->string('category')->nullable();
            $table->string('cover', 8)->nullable();
            $table->string('access')->default('De por vida');
            $table->string('status')->default('Activo');
            $table->string('format')->default('HTML interactivo');
            $table->string('source_type')->default('html');
            $table->string('protection')->default('Blindaje total');
            $table->string('primary_color', 7)->default('#4316FF');
            $table->string('secondary_color', 7)->default('#7CC21F');
            $table->text('description')->nullable();
            $table->longText('html_content')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->longText('extracted_text')->nullable();
            $table->unsignedInteger('progress')->default(0);
            $table->unsignedInteger('last_page')->default(1);
            $table->unsignedInteger('total_pages')->default(1);
            $table->boolean('offline')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ebooks');
    }
};
