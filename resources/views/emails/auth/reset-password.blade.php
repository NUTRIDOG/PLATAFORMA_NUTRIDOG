<!DOCTYPE html>
<html lang="es">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablece tu contraseña</title>
    </head>
    <body style="margin:0;padding:0;background:#eef3fb;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#111827;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
            Restablece tu contraseña de NutriDog y vuelve a tu biblioteca protegida.
        </div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3fb;padding:32px 14px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;">
                        <tr>
                            <td style="padding:0 0 18px;">
                                <div style="display:inline-block;padding:10px 16px;border-radius:999px;background:rgba(67,22,255,0.08);color:#4316ff;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">
                                    Acceso seguro
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:0 0 18px;">
                                <h1 style="margin:0;font-size:34px;line-height:1.02;font-weight:700;color:#111827;">
                                    Restablece tu contraseña y vuelve a NutriDog
                                </h1>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid rgba(108,124,160,0.14);border-radius:28px;box-shadow:0 24px 60px rgba(15,23,42,0.08);overflow:hidden;">
                                    <tr>
                                        <td style="padding:32px 32px 24px;background:linear-gradient(135deg,#f8f9ff 0%,#ffffff 62%,#f5fbec 100%);">
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td style="padding:0 0 18px;">
                                                        <table role="presentation" cellspacing="0" cellpadding="0">
                                                            <tr>
                                                                <td style="width:60px;height:60px;border-radius:18px;background:#ffffff;text-align:center;">
                                                                    <img
                                                                        src="{{ url('/images/logo.webp') }}"
                                                                        alt="Logo de NutriDog"
                                                                        width="60"
                                                                        height="60"
                                                                        style="display:block;width:60px;height:60px;border:0;border-radius:18px;object-fit:cover;"
                                                                    >
                                                                </td>
                                                                <td style="padding-left:14px;">
                                                                    <div style="font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#4316ff;">Cuenta protegida</div>
                                                                    <div style="font-size:18px;font-weight:700;color:#111827;">{{ $appName }}</div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:0 0 16px;font-size:16px;line-height:1.7;color:#475569;">
                                                        Hola{{ $name ? ' ' . $name : '' }}, recibimos una solicitud para cambiar la contraseña de tu cuenta.
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:0 0 16px;font-size:16px;line-height:1.7;color:#475569;">
                                                        Si fuiste tú, usa el botón de abajo para crear una nueva contraseña y recuperar el acceso a tu biblioteca, ebooks y panel.
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0 24px;" align="center">
                                                        <a href="{{ $url }}" style="display:inline-block;padding:16px 28px;border-radius:18px;background:linear-gradient(135deg,#4316ff 0%,#6b51ff 64%,#84cc16 100%);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">
                                                            Crear nueva contraseña
                                                        </a>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:22px;background:#f8faff;border:1px solid rgba(108,124,160,0.14);">
                                                            <tr>
                                                                <td style="padding:18px 20px;font-size:14px;line-height:1.7;color:#475569;">
                                                                    <strong style="display:block;color:#111827;font-size:15px;">Importante</strong>
                                                                    Este enlace estará disponible durante {{ $expire }} minutos. Si no solicitaste este cambio, puedes ignorar este correo con tranquilidad.
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:24px 32px 30px;background:#ffffff;border-top:1px solid rgba(108,124,160,0.14);">
                                            <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#64748b;">
                                                Si el botón no funciona, copia y pega este enlace en tu navegador:
                                            </p>
                                            <p style="margin:0 0 18px;font-size:14px;line-height:1.8;word-break:break-word;">
                                                <a href="{{ $url }}" style="color:#4316ff;text-decoration:underline;">{{ $url }}</a>
                                            </p>
                                            <p style="margin:0;font-size:13px;line-height:1.7;color:#94a3b8;">
                                                Este mensaje fue enviado a {{ $email }} porque se solicitó una recuperación de contraseña en {{ $appName }}.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>
