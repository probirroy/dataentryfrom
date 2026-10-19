export interface CodeSnippetFile {
  id: string;
  filename: string;
  path: string;
  language: 'php' | 'sql' | 'blade' | 'bash';
  description: string;
  code: string;
}

export const LARAVEL_PROJECT_SNIPPETS: CodeSnippetFile[] = [
  {
    id: 'migration',
    filename: '2026_10_19_000000_create_inventory_items_table.php',
    path: 'database/migrations/2026_10_19_000000_create_inventory_items_table.php',
    language: 'php',
    description: 'MySQL Schema Migration defining columns, indexes, precision, and enum status',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for MySQL inventory table.
     */
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('sku', 64)->unique();
            $table->string('name', 255);
            $table->string('category', 100)->index();
            $table->integer('quantity')->default(0);
            $table->integer('reorder_level')->default(10);
            $table->decimal('unit_cost', 10, 2)->default(0.00);
            $table->decimal('selling_price', 10, 2)->default(0.00);
            $table->string('supplier', 255)->nullable();
            $table->string('location', 100)->nullable();
            $table->enum('status', ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'])
                  ->default('in_stock')
                  ->index();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes(); // Optional: supports safe soft deletion
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};`
  },
  {
    id: 'model',
    filename: 'InventoryItem.php',
    path: 'app/Models/InventoryItem.php',
    language: 'php',
    description: 'Eloquent ORM Model with mass assignment, custom accessors, and query scopes',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\SoftDeletes;

class InventoryItem extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model in MySQL.
     *
     * @var string
     */
    protected $table = 'inventory_items';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'sku',
        'name',
        'category',
        'quantity',
        'reorder_level',
        'unit_cost',
        'selling_price',
        'supplier',
        'location',
        'status',
        'notes',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantity' => 'integer',
        'reorder_level' => 'integer',
        'unit_cost' => 'decimal:2',
        'selling_price' => 'decimal:2',
    ];

    /**
     * Auto compute stock status based on current quantity vs reorder level.
     */
    public function determineStatus(): string
    {
        if ($this->quantity <= 0) {
            return 'out_of_stock';
        }
        if ($this->quantity <= $this->reorder_level) {
            return 'low_stock';
        }
        return 'in_stock';
    }

    /**
     * Total valuation of this item in stock (Cost basis).
     */
    public function getTotalCostValueAttribute(): float
    {
        return round($this->quantity * (float) $this->unit_cost, 2);
    }

    /**
     * Potential retail inventory value.
     */
    public function getTotalRetailValueAttribute(): float
    {
        return round($this->quantity * (float) $this->selling_price, 2);
    }

    /**
     * Profit margin percentage.
     */
    public function getProfitMarginAttribute(): float
    {
        if ($this->selling_price <= 0) return 0.0;
        return round((($this->selling_price - $this->unit_cost) / $this->selling_price) * 100, 1);
    }

    /**
     * Scope: Filter low stock items.
     */
    public function scopeLowStock($query)
    {
        return $query->where('quantity', '>', 0)
                     ->whereColumn('quantity', '<=', 'reorder_level');
    }

    /**
     * Scope: Filter out of stock items.
     */
    public function scopeOutOfStock($query)
    {
        return $query->where('quantity', '<=', 0);
    }
}`
  },
  {
    id: 'request',
    filename: 'InventoryItemRequest.php',
    path: 'app/Http/Requests/InventoryItemRequest.php',
    language: 'php',
    description: 'Form Request for validation rules and error sanitization',
    code: `<?php

namespace App\\Http\\Requests;

use Illuminate\\Foundation\\Http\\FormRequest;
use Illuminate\\Validation\\Rule;

class InventoryItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \\Illuminate\\Contracts\\Validation\\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // For updates, ignore current model's ID when checking unique SKU
        $itemId = $this->route('inventory')?->id ?? $this->route('item')?->id;

        return [
            'sku' => [
                'required',
                'string',
                'max:64',
                Rule::unique('inventory_items', 'sku')->ignore($itemId),
            ],
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'quantity' => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:0',
            'unit_cost' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'supplier' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Custom friendly validation error messages.
     */
    public function messages(): array
    {
        return [
            'sku.required' => 'The SKU code is mandatory for tracking.',
            'sku.unique' => 'An inventory item with this SKU already exists.',
            'selling_price.min' => 'Selling price cannot be negative.',
            'unit_cost.min' => 'Unit cost cannot be negative.',
        ];
    }
}`
  },
  {
    id: 'controller',
    filename: 'InventoryController.php',
    path: 'app/Http/Controllers/InventoryController.php',
    language: 'php',
    description: 'RESTful Resource Controller handling Index Dashboard, Data Entry, Show, Edit & Destroy',
    code: `<?php

namespace App\\Http\\Controllers;

use App\\Models\\InventoryItem;
use App\\Http\\Requests\\InventoryItemRequest;
use Illuminate\\Http\\Request;
use Illuminate\\View\\View;
use Illuminate\\Http\\RedirectResponse;
use Illuminate\\Support\\Facades\\DB;

class InventoryController extends Controller
{
    /**
     * Display a clean dashboard with metrics and inventory items list.
     */
    public function index(Request $request): View
    {
        // Query builder with search & filters
        $query = InventoryItem::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('supplier', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category') && $request->category !== 'All') {
            $query->where('category', $request->category);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Metrics for the dashboard cards
        $metrics = [
            'total_items' => InventoryItem::count(),
            'total_stock' => InventoryItem::sum('quantity'),
            'total_valuation' => InventoryItem::select(DB::raw('SUM(quantity * unit_cost) as total'))->value('total') ?? 0,
            'low_stock_count' => InventoryItem::lowStock()->count(),
            'out_of_stock_count' => InventoryItem::outOfStock()->count(),
        ];

        // Paginated items
        $items = $query->latest()->paginate(10)->withQueryString();
        $categories = InventoryItem::select('category')->distinct()->pluck('category');

        return view('inventory.index', compact('items', 'metrics', 'categories'));
    }

    /**
     * Show the data entry form for creating a new item.
     */
    public function create(): View
    {
        return view('inventory.create');
    }

    /**
     * Store a newly created inventory item in MySQL database.
     */
    public function store(InventoryItemRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Calculate initial status
        $quantity = (int) $data['quantity'];
        $reorderLevel = (int) $data['reorder_level'];

        if ($quantity <= 0) {
            $data['status'] = 'out_of_stock';
        } elseif ($quantity <= $reorderLevel) {
            $data['status'] = 'low_stock';
        } else {
            $data['status'] = 'in_stock';
        }

        $item = InventoryItem::create($data);

        return redirect()
            ->route('inventory.index')
            ->with('success', "Item '{$item->name}' ({$item->sku}) was added successfully!");
    }

    /**
     * Display the specified inventory item details.
     */
    public function show(InventoryItem $inventory): View
    {
        return view('inventory.show', ['item' => $inventory]);
    }

    /**
     * Show the form for editing the specified inventory item.
     */
    public function edit(InventoryItem $inventory): View
    {
        return view('inventory.edit', ['item' => $inventory]);
    }

    /**
     * Update the specified inventory item in MySQL database.
     */
    public function update(InventoryItemRequest $request, InventoryItem $inventory): RedirectResponse
    {
        $data = $request->validated();

        // Update status based on quantity
        $quantity = (int) $data['quantity'];
        $reorderLevel = (int) $data['reorder_level'];

        if ($quantity <= 0) {
            $data['status'] = 'out_of_stock';
        } elseif ($quantity <= $reorderLevel) {
            $data['status'] = 'low_stock';
        } else {
            $data['status'] = 'in_stock';
        }

        $inventory->update($data);

        return redirect()
            ->route('inventory.index')
            ->with('success', "Item '{$inventory->name}' was updated successfully!");
    }

    /**
     * Remove the specified inventory item from MySQL storage.
     */
    public function destroy(InventoryItem $inventory): RedirectResponse
    {
        $name = $inventory->name;
        $sku = $inventory->sku;

        $inventory->delete();

        return redirect()
            ->route('inventory.index')
            ->with('success', "Inventory item '{$name}' [{$sku}] deleted successfully.");
    }
}`
  },
  {
    id: 'routes',
    filename: 'web.php',
    path: 'routes/web.php',
    language: 'php',
    description: 'RESTful Resource routing configuration in Laravel',
    code: `<?php

use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\InventoryController;

// Redirect root to inventory dashboard
Route::redirect('/', '/inventory');

// Resource route covers: index, create, store, show, edit, update, destroy
Route::resource('inventory', InventoryController::class);`
  },
  {
    id: 'blade_index',
    filename: 'index.blade.php',
    path: 'resources/views/inventory/index.blade.php',
    language: 'blade',
    description: 'Blade Template: Clean Dashboard with metrics cards, search, filter and items table',
    code: `@extends('layouts.app')

@section('content')
<div class="space-y-6">
    <!-- Header with action -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Inventory Dashboard</h1>
            <p class="text-sm text-slate-500">Manage and track inventory stock, values, and suppliers in MySQL.</p>
        </div>
        <a href="{{ route('inventory.create') }}" class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            + Add New Item
        </a>
    </div>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-xs font-semibold text-slate-500 uppercase">Total Items</div>
            <div class="mt-2 text-2xl font-bold text-slate-900">{{ number_format($metrics['total_items']) }}</div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-xs font-semibold text-slate-500 uppercase">Units in Stock</div>
            <div class="mt-2 text-2xl font-bold text-slate-900">{{ number_format($metrics['total_stock']) }}</div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-xs font-semibold text-slate-500 uppercase">Total Valuation</div>
            <div class="mt-2 text-2xl font-bold text-emerald-600">\${{ number_format($metrics['total_valuation'], 2) }}</div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-xs font-semibold text-slate-500 uppercase">Low Stock Alerts</div>
            <div class="mt-2 text-2xl font-bold text-amber-600">{{ number_format($metrics['low_stock_count']) }}</div>
        </div>
    </div>

    <!-- Inventory Table Card -->
    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <!-- Search and Filters bar -->
        <form method="GET" action="{{ route('inventory.index') }}" class="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
            <div class="flex items-center gap-3 flex-1 min-w-[280px]">
                <input type="text" name="search" value="{{ request('search') }}" placeholder="Search by SKU, item name, supplier..." class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div class="flex items-center gap-2">
                <select name="category" onchange="this.form.submit()" class="text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white">
                    <option value="All">All Categories</option>
                    @foreach($categories as $cat)
                        <option value="{{ $cat }}" {{ request('category') == $cat ? 'selected' : '' }}>{{ $cat }}</option>
                    @endforeach
                </select>
                <button type="submit" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg">Filter</button>
            </div>
        </form>

        <!-- Table -->
        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
                <thead class="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                    <tr>
                        <th class="px-4 py-3">SKU & Product</th>
                        <th class="px-4 py-3">Category</th>
                        <th class="px-4 py-3 text-right">Quantity</th>
                        <th class="px-4 py-3 text-right">Unit Cost</th>
                        <th class="px-4 py-3 text-right">Price</th>
                        <th class="px-4 py-3">Status</th>
                        <th class="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @forelse($items as $item)
                        <tr class="hover:bg-slate-50/50 transition">
                            <td class="px-4 py-3.5">
                                <div class="font-semibold text-slate-900">{{ $item->name }}</div>
                                <div class="text-xs font-mono text-slate-400">{{ $item->sku }}</div>
                            </td>
                            <td class="px-4 py-3.5"><span class="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">{{ $item->category }}</span></td>
                            <td class="px-4 py-3.5 text-right font-medium {{ $item->quantity <= $item->reorder_level ? 'text-amber-600 font-bold' : 'text-slate-900' }}">{{ $item->quantity }}</td>
                            <td class="px-4 py-3.5 text-right">\${{ number_format($item->unit_cost, 2) }}</td>
                            <td class="px-4 py-3.5 text-right font-semibold text-slate-900">\${{ number_format($item->selling_price, 2) }}</td>
                            <td class="px-4 py-3.5">
                                @if($item->status == 'in_stock')
                                    <span class="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">In Stock</span>
                                @elseif($item->status == 'low_stock')
                                    <span class="px-2 py-0.5 text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200">Low Stock</span>
                                @else
                                    <span class="px-2 py-0.5 text-xs rounded-full bg-rose-50 text-rose-700 border border-rose-200">Out of Stock</span>
                                @endif
                            </td>
                            <td class="px-4 py-3.5 text-right space-x-2">
                                <a href="{{ route('inventory.show', $item) }}" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Show</a>
                                <a href="{{ route('inventory.edit', $item) }}" class="text-xs text-amber-600 hover:text-amber-800 font-medium">Edit</a>
                                <form action="{{ route('inventory.destroy', $item) }}" method="POST" class="inline" onsubmit="return confirm('Are you sure you want to delete this item?');">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="text-xs text-rose-600 hover:text-rose-800 font-medium">Delete</button>
                                </form>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" class="px-4 py-10 text-center text-slate-400">No inventory items found. Click "+ Add New Item" above!</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="p-4 border-t border-slate-100">
            {{ $items->links() }}
        </div>
    </div>
</div>
@endsection`
  },
  {
    id: 'blade_create',
    filename: 'create.blade.php',
    path: 'resources/views/inventory/create.blade.php',
    language: 'blade',
    description: 'Blade Template: Clean Data Entry Form for inserting a new item into MySQL',
    code: `@extends('layouts.app')

@section('content')
<div class="max-w-3xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-slate-900">Add Inventory Item</h1>
            <p class="text-sm text-slate-500">Fill in the fields below to add a product into the MySQL database.</p>
        </div>
        <a href="{{ route('inventory.index') }}" class="text-sm text-slate-600 hover:text-slate-900 font-medium">Back to Dashboard</a>
    </div>

    @if ($errors->any())
        <div class="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <p class="font-semibold mb-1">Please fix the following validation errors:</p>
            <ul class="list-disc list-inside space-y-0.5">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form action="{{ route('inventory.store') }}" method="POST" class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        @csrf

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">SKU / Barcode Code *</label>
                <input type="text" name="sku" value="{{ old('sku') }}" placeholder="e.g. ELEC-MOUSE-001" required class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono" />
            </div>
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Category *</label>
                <input type="text" name="category" value="{{ old('category') }}" placeholder="e.g. Electronics" required class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
        </div>

        <div>
            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Item / Product Name *</label>
            <input type="text" name="name" value="{{ old('name') }}" placeholder="e.g. Wireless Ergonomic Mouse" required class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Initial Quantity *</label>
                <input type="number" name="quantity" value="{{ old('quantity', 0) }}" min="0" required class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Reorder Level *</label>
                <input type="number" name="reorder_level" value="{{ old('reorder_level', 10) }}" min="0" required class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Unit Cost ($) *</label>
                <input type="number" step="0.01" name="unit_cost" value="{{ old('unit_cost', 0.00) }}" min="0" required class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Selling Price ($) *</label>
                <input type="number" step="0.01" name="selling_price" value="{{ old('selling_price', 0.00) }}" min="0" required class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg" />
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Supplier Name</label>
                <input type="text" name="supplier" value="{{ old('supplier') }}" placeholder="e.g. Global Tech Distributors" class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Storage Location / Aisle</label>
                <input type="text" name="location" value="{{ old('location') }}" placeholder="e.g. Aisle 4, Shelf B" class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg" />
            </div>
        </div>

        <div>
            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Notes / Description</label>
            <textarea name="notes" rows="3" placeholder="Optional details..." class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg">{{ old('notes') }}</textarea>
        </div>

        <div class="pt-3 border-t border-slate-100 flex justify-end gap-3">
            <a href="{{ route('inventory.index') }}" class="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">Cancel</a>
            <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm">Save to Database</button>
        </div>
    </form>
</div>
@endsection`
  },
  {
    id: 'blade_edit',
    filename: 'edit.blade.php',
    path: 'resources/views/inventory/edit.blade.php',
    language: 'blade',
    description: 'Blade Template: Edit Form for updating existing MySQL record',
    code: `@extends('layouts.app')

@section('content')
<div class="max-w-3xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-slate-900">Edit Inventory Item</h1>
            <p class="text-sm text-slate-500">Update record for SKU <span class="font-mono text-indigo-600">{{ $item->sku }}</span></p>
        </div>
        <a href="{{ route('inventory.index') }}" class="text-sm text-slate-600 hover:text-slate-900 font-medium">Back to Dashboard</a>
    </div>

    <form action="{{ route('inventory.update', $item) }}" method="POST" class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        @csrf
        @method('PUT')

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">SKU / Barcode Code *</label>
                <input type="text" name="sku" value="{{ old('sku', $item->sku) }}" required class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg font-mono" />
            </div>
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Category *</label>
                <input type="text" name="category" value="{{ old('category', $item->category) }}" required class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg" />
            </div>
        </div>

        <div>
            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Item / Product Name *</label>
            <input type="text" name="name" value="{{ old('name', $item->name) }}" required class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Quantity *</label>
                <input type="number" name="quantity" value="{{ old('quantity', $item->quantity) }}" min="0" required class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Reorder Level *</label>
                <input type="number" name="reorder_level" value="{{ old('reorder_level', $item->reorder_level) }}" min="0" required class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Unit Cost ($) *</label>
                <input type="number" step="0.01" name="unit_cost" value="{{ old('unit_cost', $item->unit_cost) }}" min="0" required class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Selling Price ($) *</label>
                <input type="number" step="0.01" name="selling_price" value="{{ old('selling_price', $item->selling_price) }}" min="0" required class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg" />
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Supplier</label>
                <input type="text" name="supplier" value="{{ old('supplier', $item->supplier) }}" class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Location / Aisle</label>
                <input type="text" name="location" value="{{ old('location', $item->location) }}" class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg" />
            </div>
        </div>

        <div>
            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Notes</label>
            <textarea name="notes" rows="3" class="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg">{{ old('notes', $item->notes) }}</textarea>
        </div>

        <div class="pt-3 border-t border-slate-100 flex justify-end gap-3">
            <a href="{{ route('inventory.index') }}" class="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg">Cancel</a>
            <button type="submit" class="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-sm">Update Item</button>
        </div>
    </form>
</div>
@endsection`
  },
  {
    id: 'blade_show',
    filename: 'show.blade.php',
    path: 'resources/views/inventory/show.blade.php',
    language: 'blade',
    description: 'Blade Template: Detailed View showing stock status, financials and audit info',
    code: `@extends('layouts.app')

@section('content')
<div class="max-w-2xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-slate-900">{{ $item->name }}</h1>
            <p class="text-sm font-mono text-indigo-600">{{ $item->sku }}</p>
        </div>
        <div class="flex gap-2">
            <a href="{{ route('inventory.edit', $item) }}" class="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg">Edit</a>
            <a href="{{ route('inventory.index') }}" class="px-3.5 py-1.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50">Back</a>
        </div>
    </div>

    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-100">
            <div>
                <span class="text-xs text-slate-400 uppercase font-semibold">Stock Level</span>
                <p class="text-xl font-bold text-slate-900">{{ $item->quantity }} units</p>
            </div>
            <div>
                <span class="text-xs text-slate-400 uppercase font-semibold">Unit Cost</span>
                <p class="text-xl font-bold text-slate-700">\${{ number_format($item->unit_cost, 2) }}</p>
            </div>
            <div>
                <span class="text-xs text-slate-400 uppercase font-semibold">Selling Price</span>
                <p class="text-xl font-bold text-emerald-600">\${{ number_format($item->selling_price, 2) }}</p>
            </div>
            <div>
                <span class="text-xs text-slate-400 uppercase font-semibold">Status</span>
                <p class="mt-1">
                    <span class="px-2 py-0.5 text-xs rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">{{ ucfirst(str_replace('_', ' ', $item->status)) }}</span>
                </p>
            </div>
        </div>

        <div class="space-y-3 text-sm">
            <div class="flex justify-between py-1.5 border-b border-slate-50">
                <span class="text-slate-500">Category:</span>
                <span class="font-medium text-slate-900">{{ $item->category }}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-slate-50">
                <span class="text-slate-500">Supplier:</span>
                <span class="font-medium text-slate-900">{{ $item->supplier ?: 'Not specified' }}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-slate-50">
                <span class="text-slate-500">Warehouse Location:</span>
                <span class="font-medium text-slate-900">{{ $item->location ?: 'General Warehouse' }}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-slate-50">
                <span class="text-slate-500">Total Stock Value (Cost):</span>
                <span class="font-semibold text-slate-900">\${{ number_format($item->quantity * $item->unit_cost, 2) }}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-slate-50">
                <span class="text-slate-500">Profit Margin:</span>
                <span class="font-semibold text-emerald-600">
                    {{ $item->selling_price > 0 ? round((($item->selling_price - $item->unit_cost) / $item->selling_price) * 100, 1) : 0 }}%
                </span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-slate-50">
                <span class="text-slate-500">Created At:</span>
                <span class="text-slate-600">{{ $item->created_at->format('M d, Y H:i') }}</span>
            </div>
        </div>

        @if($item->notes)
            <div class="p-3.5 bg-slate-50 rounded-lg text-sm text-slate-600">
                <span class="font-semibold block text-slate-700 mb-1">Notes:</span>
                {{ $item->notes }}
            </div>
        @endif
    </div>
</div>
@endsection`
  },
  {
    id: 'mysql_schema',
    filename: 'schema.sql',
    path: 'database/schema.sql',
    language: 'sql',
    description: 'Raw MySQL DDL & Initial Seed Data for phpMyAdmin or MySQL CLI',
    code: `-- ==========================================
-- Inventory Management System - MySQL Database Schema
-- Compatible with MySQL 8.0+ and MariaDB 10.4+
-- ==========================================

CREATE DATABASE IF NOT EXISTS \`inventory_db\` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE \`inventory_db\`;

-- Drop table if exists
DROP TABLE IF EXISTS \`inventory_items\`;

-- Create inventory_items table
CREATE TABLE \`inventory_items\` (
    \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`sku\` VARCHAR(64) NOT NULL UNIQUE,
    \`name\` VARCHAR(255) NOT NULL,
    \`category\` VARCHAR(100) NOT NULL,
    \`quantity\` INT NOT NULL DEFAULT 0,
    \`reorder_level\` INT NOT NULL DEFAULT 10,
    \`unit_cost\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    \`selling_price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    \`supplier\` VARCHAR(255) NULL,
    \`location\` VARCHAR(100) NULL,
    \`status\` ENUM('in_stock', 'low_stock', 'out_of_stock', 'discontinued') NOT NULL DEFAULT 'in_stock',
    \`notes\` TEXT NULL,
    \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
    INDEX \`idx_category\` (\`category\`),
    INDEX \`idx_status\` (\`status\`),
    INDEX \`idx_created_at\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Seed Data
INSERT INTO \`inventory_items\` 
(\`sku\`, \`name\`, \`category\`, \`quantity\`, \`reorder_level\`, \`unit_cost\`, \`selling_price\`, \`supplier\`, \`location\`, \`status\`, \`notes\`) 
VALUES
('LOG-MXM-3S', 'Logitech MX Master 3S Wireless Mouse', 'Electronics', 42, 15, 68.50, 99.99, 'Logitech Distribution', 'Aisle 3, Shelf B2', 'in_stock', 'Ergonomic mouse with 8K DPI sensor.'),
('DEL-U2723QE', 'Dell UltraSharp 27" 4K USB-C Hub Monitor', 'Electronics', 8, 10, 410.00, 579.00, 'Dell Direct', 'Aisle 2, Pallet 04', 'low_stock', 'IPS Black technology, 90W PD.'),
('HER-AER-CH', 'Herman Miller Aeron Ergonomic Chair (Size B)', 'Furniture', 14, 5, 820.00, 1395.00, 'MillerKnoll', 'Warehouse Bay 5', 'in_stock', 'Graphite frame, adjustable lumbar support.'),
('APL-MBP-14', 'Apple MacBook Pro 14" M3 Pro', 'Electronics', 0, 5, 1650.00, 1999.00, 'Ingram Micro', 'Secure Cage A', 'out_of_stock', 'Out of stock, waiting for new shipment.'),
('ANK-737-PB', 'Anker 737 Power Bank (PowerCore 24K, 140W)', 'Accessories', 53, 20, 85.00, 139.99, 'Anker Innovations', 'Aisle 4, Shelf A3', 'in_stock', 'Smart digital display power bank.');`
  },
  {
    id: 'setup_guide',
    filename: 'README_LARAVEL_SETUP.md',
    path: 'README_LARAVEL_SETUP.md',
    language: 'bash',
    description: 'Quick start terminal commands to launch this in Laravel & MySQL',
    code: `# How to run this Inventory System in Laravel 11 & MySQL

# 1. Create a new Laravel project:
composer create-project laravel/laravel inventory-app
cd inventory-app

# 2. Configure MySQL Database in your .env:
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=inventory_db
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

# 3. Create the database in MySQL:
mysql -u root -p -e "CREATE DATABASE inventory_db CHARACTER SET utf8mb4;"

# 4. Generate the Model, Migration, Controller, and FormRequest:
php artisan make:model InventoryItem -m
php artisan make:controller InventoryController --resource
php artisan make:request InventoryItemRequest

# 5. Copy the files provided into their respective directories:
# - database/migrations/*_create_inventory_items_table.php
# - app/Models/InventoryItem.php
# - app/Http/Requests/InventoryItemRequest.php
# - app/Http/Controllers/InventoryController.php
# - routes/web.php
# - resources/views/inventory/*.blade.php

# 6. Run the migrations:
php artisan migrate

# 7. Start the Laravel development server:
php artisan serve

# 8. Open in browser:
# Visit http://127.0.0.1:8000/inventory`
  }
];
