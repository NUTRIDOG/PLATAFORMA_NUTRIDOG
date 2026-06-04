<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ebook_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ebook_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('purchaser_name');
            $table->string('purchaser_email');
            $table->string('purchaser_phone', 32);
            $table->unsignedBigInteger('amount_in_cents');
            $table->string('currency', 3)->default('COP');
            $table->string('reference')->unique();
            $table->boolean('grant_all_ebooks')->default(false);
            $table->string('offer_code')->nullable();
            $table->string('wompi_transaction_id')->nullable()->unique();
            $table->string('wompi_status')->default('PENDING');
            $table->string('wompi_status_message')->nullable();
            $table->string('wompi_environment', 16)->nullable();
            $table->timestamp('checkout_expires_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('credentials_emailed_at')->nullable();
            $table->string('ip_address', 64)->nullable();
            $table->json('transaction_payload')->nullable();
            $table->timestamps();

            $table->index(['purchaser_email', 'wompi_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ebook_purchases');
    }
};
