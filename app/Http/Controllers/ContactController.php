<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function index(Request $request): Response
    {
        $contacts = [
            ['first_name' => 'Olivia', 'last_name' => 'Johnson', 'phone_number' => '+1 (415) 555-1023', 'email' => 'olivia.johnson@example.com', 'tag' => 'VIP'],
            ['first_name' => 'Liam', 'last_name' => 'Smith', 'phone_number' => '+1 (312) 555-8844', 'email' => 'liam.smith@example.com', 'tag' => 'Lead'],
            ['first_name' => 'Ava', 'last_name' => 'Williams', 'phone_number' => '+1 (917) 555-4401', 'email' => 'ava.williams@example.com', 'tag' => 'Customer'],
            ['first_name' => 'Noah', 'last_name' => 'Brown', 'phone_number' => '+1 (206) 555-7733', 'email' => 'noah.brown@example.com', 'tag' => 'Lead'],
            ['first_name' => 'Sophia', 'last_name' => 'Jones', 'phone_number' => '+1 (702) 555-2231', 'email' => 'sophia.jones@example.com', 'tag' => 'VIP'],
            ['first_name' => 'Ethan', 'last_name' => 'Garcia', 'phone_number' => '+1 (303) 555-7712', 'email' => 'ethan.garcia@example.com', 'tag' => 'Customer'],
            ['first_name' => 'Isabella', 'last_name' => 'Miller', 'phone_number' => '+1 (415) 555-9901', 'email' => 'isabella.miller@example.com', 'tag' => 'Lead'],
            ['first_name' => 'Mason', 'last_name' => 'Davis', 'phone_number' => '+1 (512) 555-4477', 'email' => 'mason.davis@example.com', 'tag' => 'Prospect'],
            ['first_name' => 'Mia', 'last_name' => 'Rodriguez', 'phone_number' => '+1 (305) 555-6677', 'email' => 'mia.rodriguez@example.com', 'tag' => 'Customer'],
            ['first_name' => 'Logan', 'last_name' => 'Martinez', 'phone_number' => '+1 (702) 555-3388', 'email' => 'logan.martinez@example.com', 'tag' => 'Lead'],
            ['first_name' => 'Amelia', 'last_name' => 'Hernandez', 'phone_number' => '+1 (646) 555-1188', 'email' => 'amelia.hernandez@example.com', 'tag' => 'Prospect'],
            ['first_name' => 'Lucas', 'last_name' => 'Lopez', 'phone_number' => '+1 (210) 555-5522', 'email' => 'lucas.lopez@example.com', 'tag' => 'Customer'],
        ];

        $csvHeaders = ['First Name', 'Last Name', 'Phone', 'Email', 'Company', 'Tag'];

        return Inertia::render('contacts/index', [
            'contacts' => $contacts,
            'csvHeaders' => $csvHeaders,
        ]);
    }
}
