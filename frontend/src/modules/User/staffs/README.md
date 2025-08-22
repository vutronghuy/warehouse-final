# Staff Product Import Feature

## Overview
This feature allows staff members to import products from Excel files into the system. The import process includes validation, error reporting, and automatic data mapping.

## Components

### 1. ImportProduct.vue
- **Purpose**: Handles Excel file upload and import process
- **Features**:
  - Drag & drop file upload
  - Excel template download
  - Import progress tracking
  - Error reporting with detailed messages
  - Success/failure statistics

### 2. ProductTable.vue
- **Purpose**: Displays products with staff-specific columns
- **Features**:
  - Product listing with pagination
  - Search and filter functionality
  - Additional columns: Import Date, Status, Min Stock Level
  - Import button integration

### 3. staff.vue
- **Purpose**: Main staff dashboard with tabbed interface
- **Features**:
  - Products tab for viewing products
  - Import tab for uploading Excel files
  - User info display
  - Logout functionality

## Excel File Format

### Required Columns:
- **name** (required): Product name
- **sku** (required): Product SKU (must be unique)
- **description** (optional): Product description
- **unit** (required): Unit of measurement (pcs, kg, liter, box, pack)
- **basePrice** (required): Base price (number)
- **category** (required): Category name (must exist in system)
- **primarySupplier** (required): Supplier name (must exist in system)
- **minStockLevel** (optional): Minimum stock level (number, default: 0)

### Automatic Fields:
- **Import Date**: Set to current date/time
- **Status**: Set to "in stock" by default
- **Created By**: Set to current user

## API Endpoints

### Import Products
- **POST** `/api/products/import`
- **Headers**: Authorization Bearer token
- **Body**: FormData with Excel file
- **Response**: Import statistics and error details

### Download Template
- **GET** `/api/products/import/template`
- **Headers**: Authorization Bearer token
- **Response**: Excel file download

## Validation Rules

1. **Name & SKU**: Required fields
2. **SKU Uniqueness**: Must not exist in database
3. **Unit**: Must be one of: pcs, kg, liter, box, pack
4. **Category**: Must exist in active categories
5. **Supplier**: Must exist in active suppliers (cooperation status)
6. **Price**: Must be a valid number
7. **Min Stock Level**: Must be a valid number (optional)

## Error Handling

- Row-by-row validation
- Detailed error messages with row numbers
- Partial import support (successful rows are imported even if some fail)
- File cleanup after processing

## Usage Instructions

1. **Access**: Login as staff user
2. **Navigate**: Go to Staff Dashboard → Import Products tab
3. **Download Template**: Click "Download Template" to get Excel format
4. **Fill Data**: Complete the Excel file with product information
5. **Upload**: Drag & drop or click to upload the Excel file
6. **Review**: Check import results and error messages
7. **Verify**: Switch to Products tab to see imported products

## Technical Notes

- File size limit: 5MB
- Supported formats: .xlsx, .xls
- Temporary file storage in `/uploads` directory
- Automatic file cleanup after processing
- Real-time validation during import process

## Permissions

- **Staff**: Can view products and import new products
- **Admin**: Can view, import, create, and edit products
- **Super Admin**: Full access including delete operations
