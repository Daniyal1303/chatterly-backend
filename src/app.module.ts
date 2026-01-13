import { Module } from "@nestjs/common";
import { ChatModule } from "./chat/chat.module";

@Module({
  providers: [],
  imports: [ChatModule],
})
export class AppModule {}
