# Generated by Django 4.2.7 on 2023-11-26 12:08

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0008_comment_bids'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Bids',
        ),
    ]
