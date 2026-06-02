<?php

namespace App\Notifications\Auth;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected string $token
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $email = $notifiable->getEmailForPasswordReset();
        $url = route('password.reset', [
            'token' => $this->token,
            'email' => $email,
        ]);
        $expire = config('auth.passwords.' . config('auth.defaults.passwords') . '.expire');

        return (new MailMessage)
            ->subject('Restablece tu contraseña de NutriDog')
            ->view('emails.auth.reset-password', [
                'name' => $notifiable->name,
                'email' => $email,
                'url' => $url,
                'expire' => $expire,
                'appName' => 'NutriDog',
            ]);
    }
}
