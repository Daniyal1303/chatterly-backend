import { Module } from "@nestjs/common";
import { ChatModule } from "./chat/chat.module";
import { PrismaService } from './prisma/prisma.service';

@Module({
  providers: [PrismaService],
  imports: [ChatModule],
})
export class AppModule {}
