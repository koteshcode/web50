# Generated by Django 4.2.7 on 2023-11-23 18:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0003_alter_item_category'),
    ]

    operations = [
        migrations.AddField(
            model_name='item',
            name='image',
            field=models.URLField(blank=True),
        ),
    ]
