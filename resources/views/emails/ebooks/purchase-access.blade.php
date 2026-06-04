<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Acceso a ebook</title>
</head>
<body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#102030;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(16,24,40,0.08);">
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#4316ff;">NutriDog</p>
                            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">Tu compra fue aprobada</h1>
                            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                                Hola {{ $userName }}, ya tienes acceso al ebook <strong>{{ $ebook->title }}</strong>.
                            </p>
                            <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">
                                Usuario: <strong>{{ $userEmail }}</strong><br>
                                @if ($plainPassword)
                                    Password temporal: <strong>{{ $plainPassword }}</strong>
                                @else
                                    Tu cuenta ya existia, por eso mantuvimos tu password actual.
                                @endif
                            </p>
                            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
                                Entra a tu biblioteca para empezar a leer. Si es tu primera compra, te recomendamos iniciar sesion y luego cambiar la clave desde tu perfil o usando recuperacion de password.
                            </p>
                            <p style="margin:0 0 12px;">
                                <a href="{{ $loginUrl }}" style="display:inline-block;padding:14px 22px;border-radius:16px;background:#4316ff;color:#ffffff;text-decoration:none;font-weight:700;">Iniciar sesion</a>
                            </p>
                            <p style="margin:0;font-size:14px;line-height:1.6;color:#526071;">
                                Biblioteca: <a href="{{ $libraryUrl }}">{{ $libraryUrl }}</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
