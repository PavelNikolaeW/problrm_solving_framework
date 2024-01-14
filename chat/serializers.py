from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Chat, Message


class MembersSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'


class ChatSerializer(serializers.ModelSerializer):
    members = MembersSerializer(many=True)

    class Meta:
        model = Chat
        fields = ['id', 'members', 'created_at', 'name']


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.ReadOnlyField(source='sender.username')
    chat = serializers.PrimaryKeyRelatedField(queryset=Chat.objects.all())

    class Meta:
        model = Message
        fields = ['id', 'chat', 'sender', 'text', 'image', 'timestamp', 'is_read']
