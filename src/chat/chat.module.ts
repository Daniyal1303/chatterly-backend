import { Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatGateway } from "./chat.gateway";
import { ChatRepository } from "./chat.repository";

@Module({
  providers: [ChatService, ChatGateway, ChatRepository],
})
export class ChatModule {}
