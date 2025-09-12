from django.core.mail import send_mail
from django.conf import settings


def send_alert_email(to_email: str, symbol: str, current_price: float, target_price: float, alert_type: str):
    """Send a simple alert email to the given recipient.

    alert_type: 'price_above' | 'price_below'
    """
    if not to_email:
        return 0

    subject = f"Price alert triggered: {symbol}"
    direction = 'above' if alert_type == 'price_above' else 'below'
    body = (
        f"Hello,\n\n"
        f"Your alert for {symbol} just triggered.\n"
        f"Current price: ${current_price:.2f}\n"
        f"Target price ({direction}): ${target_price:.2f}\n\n"
        f"This is an automated message from StockTracker."
    )

    return send_mail(
        subject=subject,
        message=body,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
        recipient_list=[to_email],
        fail_silently=not getattr(settings, 'DEBUG', False),
    )
