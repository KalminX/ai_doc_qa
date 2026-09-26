import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger("doc_qa.websocket")

class DocumentIndexingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.doc_id = self.scope["url_route"]["kwargs"]["document_id"]
        self.room_group_name = f"doc_{self.doc_id}"

        # Join document indexing channel group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        logger.info(f"WebSocket client connected to group '{self.room_group_name}'")

    async def disconnect(self, close_code):
        # Leave group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"WebSocket client disconnected from group '{self.room_group_name}'")

    async def indexing_progress(self, event):
        """Receive progress message from channel layer group and send to WebSocket client."""
        await self.send(text_data=json.dumps({
            "type": "indexing_progress",
            "document_id": event["document_id"],
            "status": event["status"],
            "stage": event.get("stage", ""),
            "progress": event.get("progress", 0),
            "message": event.get("message", ""),
            "processed_chunks": event.get("processed_chunks", 0),
            "total_chunks": event.get("total_chunks", 0),
            "tier": event.get("tier", "free"),
        }))
