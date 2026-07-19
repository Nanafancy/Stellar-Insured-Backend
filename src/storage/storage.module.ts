import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { IpfsPinProcessor } from './ipfs-pin.processor';
import { QueueModule } from '../queue.module';

@Module({
  imports: [QueueModule],
  controllers: [StorageController],
  providers: [StorageService, IpfsPinProcessor],
  exports: [StorageService],
})
export class StorageModule {}
