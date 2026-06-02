<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class EbookCombo extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'access',
        'status',
    ];

    public function ebooks(): BelongsToMany
    {
        return $this->belongsToMany(Ebook::class, 'combo_ebook')
            ->withPivot('sort_order')
            ->orderBy('combo_ebook.sort_order');
    }
}
