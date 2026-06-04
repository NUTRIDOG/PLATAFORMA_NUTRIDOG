<?php

namespace App\Mail;

use App\Models\Ebook;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EbookPurchaseAccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Ebook $ebook,
        public string $userName,
        public string $userEmail,
        public ?string $plainPassword,
        public string $loginUrl,
        public string $libraryUrl
    ) {
    }

    public function build(): self
    {
        return $this->subject('Tu acceso a ' . $this->ebook->title . ' ya esta listo')
            ->view('emails.ebooks.purchase-access');
    }
}
