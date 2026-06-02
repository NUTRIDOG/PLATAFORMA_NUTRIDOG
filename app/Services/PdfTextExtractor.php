<?php

namespace App\Services;

class PdfTextExtractor
{
    public function extract(string $path): array
    {
        if (! is_file($path)) {
            return [
                'pages' => [],
                'text' => '',
                'page_count' => 1,
            ];
        }

        $data = file_get_contents($path);

        if ($data === false) {
            return [
                'pages' => [],
                'text' => '',
                'page_count' => 1,
            ];
        }

        preg_match_all('/(\d+)\s+\d+\s+obj(.*?)stream\s*(.*?)\s*endstream/si', $data, $matches, PREG_SET_ORDER);

        $pages = [];

        foreach ($matches as $match) {
            [$full, $objectId, $dictionary, $stream] = $match;

            if (! str_contains($dictionary, '/FlateDecode') && ! str_contains($dictionary, '/ASCII85Decode') && ! str_contains($stream, 'Tj') && ! str_contains($stream, 'TJ')) {
                continue;
            }

            $decodedStream = $this->decodeStream($dictionary, $stream);

            if ($decodedStream === '') {
                continue;
            }

            $lines = $this->extractPageText($decodedStream);

            if ($lines === []) {
                continue;
            }

            $pages[] = [
                'page' => count($pages) + 1,
                'object' => (int) $objectId,
                'title' => $lines[0],
                'content' => implode("\n", $lines),
            ];
        }

        $text = collect($pages)
            ->pluck('content')
            ->filter()
            ->implode("\n\n");

        return [
            'pages' => $pages,
            'text' => $text,
            'page_count' => max(count($pages), 1),
        ];
    }

    protected function decodeStream(string $dictionary, string $stream): string
    {
        $output = $stream;

        if (str_contains($dictionary, 'ASCII85Decode')) {
            $output = $this->ascii85Decode($output);
        }

        if (str_contains($dictionary, 'FlateDecode')) {
            $inflated = @gzuncompress($output);

            if ($inflated === false) {
                $inflated = @gzdecode($output);
            }

            $output = $inflated ?: '';
        }

        return is_string($output) ? $output : '';
    }

    protected function ascii85Decode(string $input): string
    {
        $out = '';
        $state = 0;
        $chunk = [0, 0, 0, 0, 0];
        $length = strlen($input);

        for ($i = 0; $i < $length; $i++) {
            $ord = ord($input[$i]);

            if ($ord === 126) {
                break;
            }

            if ($ord === 122 && $state === 0) {
                $out .= "\0\0\0\0";
                continue;
            }

            if ($ord < 33 || $ord > 117) {
                continue;
            }

            $chunk[$state++] = $ord - 33;

            if ($state !== 5) {
                continue;
            }

            $tuple = ((((($chunk[0] * 85) + $chunk[1]) * 85 + $chunk[2]) * 85 + $chunk[3]) * 85 + $chunk[4]);
            $out .= chr(($tuple >> 24) & 255) . chr(($tuple >> 16) & 255) . chr(($tuple >> 8) & 255) . chr($tuple & 255);
            $state = 0;
        }

        if ($state > 0) {
            for ($j = $state; $j < 5; $j++) {
                $chunk[$j] = 84;
            }

            $tuple = ((((($chunk[0] * 85) + $chunk[1]) * 85 + $chunk[2]) * 85 + $chunk[3]) * 85 + $chunk[4]);

            for ($j = 0; $j < $state - 1; $j++) {
                $out .= chr(($tuple >> (24 - (8 * $j))) & 255);
            }
        }

        return $out;
    }

    protected function extractPageText(string $stream): array
    {
        preg_match_all('/\[(.*?)\]\s*TJ|\((?:\\\\.|[^\\\\)])*\)\s*Tj/s', $stream, $matches, PREG_SET_ORDER);
        $lines = [];

        foreach ($matches as $match) {
            $line = '';

            if (! empty($match[1])) {
                preg_match_all('/\((?:\\\\.|[^\\\\)])*\)/', $match[1], $parts);

                foreach ($parts[0] as $part) {
                    $line .= $this->pdfUnescape(substr($part, 1, -1));
                }
            } else {
                $open = strpos($match[0], '(');
                $close = strrpos($match[0], ')');

                if ($open !== false && $close !== false && $close > $open) {
                    $line = $this->pdfUnescape(substr($match[0], $open + 1, $close - $open - 1));
                }
            }

            $line = trim(preg_replace('/\s+/', ' ', $line) ?? '');

            if ($line !== '') {
                $lines[] = $line;
            }
        }

        return array_values(array_unique($lines));
    }

    protected function pdfUnescape(string $text): string
    {
        return preg_replace_callback('/\\\\([0-7]{1,3}|.|$)/s', static function (array $matches): string {
            $value = $matches[1];

            return match ($value) {
                'n' => "\n",
                'r' => "\r",
                't' => "\t",
                'b' => "\b",
                'f' => "\f",
                '(' => '(',
                ')' => ')',
                '\\' => '\\',
                default => ctype_digit($value[0] ?? '') ? chr(octdec($value)) : $value,
            };
        }, $text) ?? $text;
    }
}
