<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ebook extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'author',
        'category',
        'cover',
        'cover_image_path',
        'access',
        'status',
        'format',
        'source_type',
        'protection',
        'primary_color',
        'secondary_color',
        'description',
        'html_content',
        'file_path',
        'file_name',
        'extracted_text',
        'progress',
        'last_page',
        'total_pages',
        'offline',
        'is_featured',
        'published_at',
    ];

    protected $casts = [
        'offline' => 'boolean',
        'is_featured' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function progressEntries(): HasMany
    {
        return $this->hasMany(EbookUserProgress::class);
    }

    public function combos(): BelongsToMany
    {
        return $this->belongsToMany(EbookCombo::class, 'combo_ebook')
            ->withPivot('sort_order');
    }
}
