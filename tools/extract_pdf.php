<?php

function ascii85_decode_fast(string $input): string
{
    $out = '';
    $state = 0;
    $chn = [0, 0, 0, 0, 0];
    $len = strlen($input);

    for ($i = 0; $i < $len; $i++) {
        $o = ord($input[$i]);

        if ($o === 126) {
            break;
        }

        if ($o === 122 && $state === 0) {
            $out .= "\0\0\0\0";
            continue;
        }

        if ($o < 33 || $o > 117) {
            continue;
        }

        $chn[$state++] = $o - 33;

        if ($state === 5) {
            $tuple = ((((($chn[0] * 85) + $chn[1]) * 85 + $chn[2]) * 85 + $chn[3]) * 85 + $chn[4]);
            $out .= chr(($tuple >> 24) & 255) . chr(($tuple >> 16) & 255) . chr(($tuple >> 8) & 255) . chr($tuple & 255);
            $state = 0;
        }
    }

    if ($state > 0) {
        for ($j = $state; $j < 5; $j++) {
            $chn[$j] = 84;
        }

        $tuple = ((((($chn[0] * 85) + $chn[1]) * 85 + $chn[2]) * 85 + $chn[3]) * 85 + $chn[4]);

        for ($j = 0; $j < $state - 1; $j++) {
            $out .= chr(($tuple >> (24 - 8 * $j)) & 255);
        }
    }

    return $out;
}

function pdf_unescape(string $text): string
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
    }, $text);
}

function extract_page_text(string $stream): array
{
    preg_match_all('/\[(.*?)\]\s*TJ|\((?:\\\\.|[^\\\\)])*\)\s*Tj/s', $stream, $matches, PREG_SET_ORDER);
    $lines = [];

    foreach ($matches as $match) {
        $line = '';

        if (!empty($match[1])) {
            preg_match_all('/\((?:\\\\.|[^\\\\)])*\)/', $match[1], $parts);

            foreach ($parts[0] as $part) {
                $line .= pdf_unescape(substr($part, 1, -1));
            }
        } else {
            $open = strpos($match[0], '(');
            $close = strrpos($match[0], ')');

            if ($open !== false && $close !== false && $close > $open) {
                $line = pdf_unescape(substr($match[0], $open + 1, $close - $open - 1));
            }
        }

        $line = trim($line);

        if ($line !== '') {
            $lines[] = $line;
        }
    }

    return $lines;
}

$pdfPath = $argv[1] ?? '';

if ($pdfPath === '' || ! is_file($pdfPath)) {
    fwrite(STDERR, "PDF not found.\n");
    exit(1);
}

$data = file_get_contents($pdfPath);
$output = [];

for ($obj = 32; $obj <= 47; $obj++) {
    $needle = "\n{$obj} 0 obj";
    $position = strpos($data, $needle);

    if ($position === false && $obj === 32) {
        $position = strpos($data, "{$obj} 0 obj");
    }

    if ($position === false) {
        continue;
    }

    $streamPosition = strpos($data, 'stream', $position);
    $streamStart = strpos($data, "\n", $streamPosition) + 1;
    $streamEnd = strpos($data, 'endstream', $streamStart);
    $dictionary = substr($data, $position, $streamPosition - $position);
    $stream = substr($data, $streamStart, $streamEnd - $streamStart);

    if (str_contains($dictionary, 'ASCII85Decode')) {
        $stream = ascii85_decode_fast($stream);
    }

    if (str_contains($dictionary, 'FlateDecode')) {
        $stream = @gzuncompress($stream) ?: '';
    }

    if ($stream === '') {
        continue;
    }

    $output[] = '=== PAGE ' . ($obj - 31) . ' ===';
    $output = array_merge($output, extract_page_text($stream), ['']);
}

echo implode(PHP_EOL, $output);
