<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\Ebook;
use App\Models\EbookCombo;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $permissions = [
            'view storefront',
            'access library',
            'read ebooks',
            'manage ebooks',
            'manage users',
            'manage combos',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $editorRole = Role::firstOrCreate(['name' => 'editor']);
        $readerRole = Role::firstOrCreate(['name' => 'reader']);

        $adminRole->syncPermissions($permissions);
        $editorRole->syncPermissions(['view storefront', 'access library', 'read ebooks', 'manage ebooks']);
        $readerRole->syncPermissions(['view storefront', 'access library', 'read ebooks']);

        $admin = User::firstOrCreate(
            ['email' => 'admin@nutridog.test'],
            [
                'name' => 'NutriDog Admin',
                'password' => Hash::make('password'),
            ],
        );

        $editor = User::firstOrCreate(
            ['email' => 'editor@nutridog.test'],
            [
                'name' => 'NutriDog Editor',
                'password' => Hash::make('password'),
            ],
        );

        $reader = User::firstOrCreate(
            ['email' => 'reader@nutridog.test'],
            [
                'name' => 'NutriDog Reader',
                'password' => Hash::make('password'),
            ],
        );

        $admin->syncRoles([$adminRole]);
        $editor->syncRoles([$editorRole]);
        $reader->syncRoles([$readerRole]);

        $ebooks = [
            [
                'title' => 'Guia NutriDog Premium',
                'slug' => 'guia-nutridog-premium',
                'author' => 'Equipo NutriDog',
                'category' => 'Nutricion avanzada',
                'cover' => 'ND',
                'access' => 'De por vida',
                'status' => 'Activo',
                'format' => 'HTML interactivo',
                'source_type' => 'html',
                'protection' => 'Blindaje total',
                'primary_color' => '#4316FF',
                'secondary_color' => '#7CC21F',
                'description' => 'Plan maestro de alimentacion, salud digestiva y rutinas para perros de alto rendimiento.',
                'price_in_cop' => 89000,
                'html_content' => '<section><h2>Guia central</h2><p>Este ebook fue creado desde HTML para demostrar la experiencia editorial dentro de la app.</p><p>Incluye estructura, ritmo tipografico y lectura protegida.</p></section>',
                'progress' => 78,
                'last_page' => 94,
                'total_pages' => 120,
                'offline' => true,
                'is_featured' => true,
                'published_at' => now(),
            ],
            [
                'title' => 'Recetario Funcional Canino',
                'slug' => 'recetario-funcional-canino',
                'author' => 'Dra. Valeria Pardo',
                'category' => 'Recetas',
                'cover' => 'RF',
                'access' => 'Activo',
                'status' => 'En progreso',
                'format' => 'HTML interactivo',
                'source_type' => 'html',
                'protection' => 'Streaming protegido',
                'primary_color' => '#1E293B',
                'secondary_color' => '#7CC21F',
                'description' => 'Recetas, porciones y combinaciones seguras para etapas de crecimiento, mantenimiento y recuperacion.',
                'price_in_cop' => 69000,
                'html_content' => '<section><h2>Recetas clave</h2><p>Organiza porciones, ingredientes y recomendaciones de uso segun etapa del perro.</p></section>',
                'progress' => 42,
                'last_page' => 33,
                'total_pages' => 86,
                'offline' => false,
                'is_featured' => false,
                'published_at' => now(),
            ],
        ];

        foreach ($ebooks as $ebookData) {
            Ebook::updateOrCreate(
                ['slug' => $ebookData['slug']],
                array_merge($ebookData, ['user_id' => $admin->id]),
            );
        }

        $starterCombo = EbookCombo::updateOrCreate(
            ['slug' => 'pack-inicio-nutridog'],
            [
                'title' => 'Pack Inicio NutriDog',
                'description' => 'Combo editorial para nuevos lectores con guia premium y recetas funcionales.',
                'access' => 'Premium',
                'status' => 'Activo',
            ],
        );

        $starterCombo->ebooks()->sync(
            Ebook::query()
                ->whereIn('slug', ['guia-nutridog-premium', 'recetario-funcional-canino'])
                ->pluck('id')
                ->values()
                ->mapWithKeys(fn ($id, $index) => [$id => ['sort_order' => $index]])
                ->all()
        );
    }
}
