<<<<<<< Updated upstream
import { Controller } from '@nestjs/common';
=======
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ItemsService } from './items.service';
>>>>>>> Stashed changes

@Controller('items')
export class ItemsController {}
