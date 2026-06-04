<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EbookPurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'ebook_id',
        'user_id',
        'purchaser_name',
        'purchaser_email',
        'purchaser_phone',
        'amount_in_cents',
        'currency',
        'reference',
        'grant_all_ebooks',
        'offer_code',
        'wompi_transaction_id',
        'wompi_status',
        'wompi_status_message',
        'wompi_environment',
        'checkout_expires_at',
        'approved_at',
        'credentials_emailed_at',
        'ip_address',
        'transaction_payload',
    ];

    protected $casts = [
        'grant_all_ebooks' => 'boolean',
        'checkout_expires_at' => 'datetime',
        'approved_at' => 'datetime',
        'credentials_emailed_at' => 'datetime',
        'transaction_payload' => 'array',
    ];

    public function ebook(): BelongsTo
    {
        return $this->belongsTo(Ebook::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
