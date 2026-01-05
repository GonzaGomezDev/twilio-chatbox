import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/contexts/toast-context';

interface Contact {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    tag?: string;
}

interface Props {
    contacts: Contact[];
    csvHeaders: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Contacts', href: '/contacts' },
];

export default function ContactsIndex({ contacts, csvHeaders }: Props) {
    const { success } = useToast();
    const [fileName, setFileName] = useState<string | null>(null);
    const [mapping, setMapping] = useState<Record<string, string>>({
        first_name: 'First Name',
        last_name: 'Last Name',
        phone_number: 'Phone',
        email: 'Email',
    });
    const [filter, setFilter] = useState('');

    const mappedContacts = useMemo(() => {
        if (!filter.trim()) return contacts;
        return contacts.filter((c) =>
            `${c.first_name} ${c.last_name} ${c.phone_number} ${c.email} ${c.tag ?? ''}`
                .toLowerCase()
                .includes(filter.toLowerCase())
        );
    }, [contacts, filter]);

    useEffect(() => {
        setMapping((prev) => ({
            ...prev,
            first_name: csvHeaders[0] ?? 'First Name',
        }));
    }, [csvHeaders]);

    const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            success('CSV selected', `${file.name} is ready for mapping`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="mt-3">
                <Head title="Contacts" />
            </div>
            <div className="space-y-8 px-3">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Contacts</h1>
                        <p className="text-muted-foreground">Manage and import your contacts for messaging.</p>
                    </div>
                    <Button variant="outline">Add contact</Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Bulk import</CardTitle>
                            <CardDescription>Upload a CSV, map the columns, and review before saving.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="csv-upload">CSV file</Label>
                                <Input
                                    id="csv-upload"
                                    type="file"
                                    accept=".csv"
                                    onChange={onFileChange}
                                />
                                {fileName && (
                                    <p className="text-sm text-muted-foreground">Selected: {fileName}</p>
                                )}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {[
                                    { key: 'first_name', label: 'First name' },
                                    { key: 'last_name', label: 'Last name' },
                                    { key: 'phone_number', label: 'Phone number' },
                                    { key: 'email', label: 'Email' },
                                ].map((field) => (
                                    <div className="space-y-2" key={field.key}>
                                        <Label>{field.label}</Label>
                                        <Select
                                            value={mapping[field.key] ?? ''}
                                            onValueChange={(value) =>
                                                setMapping((prev) => ({ ...prev, [field.key]: value }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {csvHeaders.map((header) => (
                                                    <SelectItem key={header} value={header}>
                                                        {header}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <Button className="w-full md:w-auto">Preview import</Button>
                                <Button variant="secondary" className="w-full md:w-auto">Download sample CSV</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Contact mapping</CardTitle>
                            <CardDescription>Ensure your CSV matches the fields we need.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex items-center justify-between rounded-md border p-3">
                                <div>
                                    <p className="font-semibold text-foreground">First name</p>
                                    <p className="text-xs">Maps to: {mapping.first_name || 'Select a column'}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-md border p-3">
                                <div>
                                    <p className="font-semibold text-foreground">Last name</p>
                                    <p className="text-xs">Maps to: {mapping.last_name || 'Select a column'}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-md border p-3">
                                <div>
                                    <p className="font-semibold text-foreground">Phone number</p>
                                    <p className="text-xs">Maps to: {mapping.phone_number || 'Select a column'}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-md border p-3">
                                <div>
                                    <p className="font-semibold text-foreground">Email</p>
                                    <p className="text-xs">Maps to: {mapping.email || 'Select a column'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="gap-4">
                        <div>
                            <CardTitle>Contacts</CardTitle>
                            <CardDescription>Imported or manually added contacts</CardDescription>
                        </div>
                        <Input
                            placeholder="Search contacts"
                            className="max-w-xs"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </CardHeader>
                    <CardContent className="overflow-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b text-xs uppercase text-muted-foreground">
                                    <th className="py-2 pr-4">First</th>
                                    <th className="py-2 pr-4">Last</th>
                                    <th className="py-2 pr-4">Phone</th>
                                    <th className="py-2 pr-4">Email</th>
                                    <th className="py-2 pr-4">Tag</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mappedContacts.map((contact, idx) => (
                                    <tr key={`${contact.email}-${idx}`} className="border-b last:border-b-0">
                                        <td className="py-3 pr-4 font-medium">{contact.first_name}</td>
                                        <td className="py-3 pr-4">{contact.last_name}</td>
                                        <td className="py-3 pr-4">{contact.phone_number}</td>
                                        <td className="py-3 pr-4">{contact.email}</td>
                                        <td className="py-3 pr-4">{contact.tag ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {mappedContacts.length === 0 && (
                            <p className="py-6 text-center text-sm text-muted-foreground">No contacts match your search.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
