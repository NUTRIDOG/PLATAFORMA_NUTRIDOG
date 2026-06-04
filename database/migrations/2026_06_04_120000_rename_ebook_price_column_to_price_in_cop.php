<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ebooks', function (Blueprint $table) {
            if (! Schema::hasColumn('ebooks', 'price_in_cop')) {
                $table->unsignedBigInteger('price_in_cop')->default(0)->after('description');
            }
        });

        if (Schema::hasColumn('ebooks', 'price_in_cents')) {
            DB::table('ebooks')->update([
                'price_in_cop' => DB::raw('price_in_cents'),
            ]);

            Schema::table('ebooks', function (Blueprint $table) {
                $table->dropColumn('price_in_cents');
            });
        }
    }

    public function down(): void
    {
        Schema::table('ebooks', function (Blueprint $table) {
            if (! Schema::hasColumn('ebooks', 'price_in_cents')) {
                $table->unsignedBigInteger('price_in_cents')->default(0)->after('description');
            }
        });

        if (Schema::hasColumn('ebooks', 'price_in_cop')) {
            DB::table('ebooks')->update([
                'price_in_cents' => DB::raw('price_in_cop'),
            ]);

            Schema::table('ebooks', function (Blueprint $table) {
                $table->dropColumn('price_in_cop');
            });
        }
    }
};
