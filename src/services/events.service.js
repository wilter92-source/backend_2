import { eventsRepository } from '../repositories/events.repository.js';

export class EventsService {
  constructor(repository) {
    this.repository = repository;
  }
  async list() {
    return this.repository.findAll();
  }
}
export const eventsService = new EventsService(eventsRepository);
