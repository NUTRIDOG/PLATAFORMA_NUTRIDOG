<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

class WompiService
{
    public function checkoutConfig(array $purchase, array $customer): array
    {
        return [
            'publicKey' => config('services.wompi.public_key'),
            'currency' => $purchase['currency'],
            'amountInCents' => $purchase['amount_in_cents'],
            'reference' => $purchase['reference'],
            'signature' => [
                'integrity' => $this->integritySignature(
                    $purchase['reference'],
                    $purchase['amount_in_cents'],
                    $purchase['currency'],
                    $purchase['expiration_time'] ?? null,
                ),
            ],
            'redirectUrl' => $purchase['redirect_url'],
            'expirationTime' => $purchase['expiration_time'] ?? null,
            'customerData' => [
                'email' => $customer['email'],
                'fullName' => $customer['name'],
                'phoneNumber' => $customer['phone'],
                'phoneNumberPrefix' => '+57',
            ],
        ];
    }

    public function integritySignature(string $reference, int $amountInCents, string $currency, ?string $expirationTime = null): string
    {
        $secret = (string) config('services.wompi.integrity_secret');
        $raw = $reference . $amountInCents . $currency . ($expirationTime ?? '') . $secret;

        return hash('sha256', $raw);
    }

    public function fetchTransaction(string $transactionId): array
    {
        $response = Http::baseUrl($this->baseUrl())
            ->withToken(config('services.wompi.public_key'))
            ->acceptJson()
            ->get('/transactions/' . $transactionId)
            ->throw()
            ->json();

        return Arr::get($response, 'data', []);
    }

    public function validateEventSignature(array $payload): bool
    {
        $secret = (string) config('services.wompi.events_secret');

        if ($secret === '') {
            return false;
        }

        $properties = Arr::get($payload, 'signature.properties', []);
        $data = (array) Arr::get($payload, 'data', []);
        $timestamp = (string) Arr::get($payload, 'timestamp', '');
        $received = (string) Arr::get($payload, 'signature.checksum', '');

        $base = collect($properties)
            ->map(fn (string $property) => (string) Arr::get($data, $property))
            ->implode('');

        $expected = hash('sha256', $base . $timestamp . $secret);

        return hash_equals(strtolower($received), strtolower($expected));
    }

    protected function baseUrl(): string
    {
        $baseUrl = rtrim((string) config('services.wompi.base_url', 'https://sandbox.wompi.co/v1'), '/');

        if (str_ends_with($baseUrl, '/v1')) {
            return $baseUrl;
        }

        return $baseUrl . '/v1';
    }
}
