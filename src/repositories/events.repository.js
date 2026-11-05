import { eventsDao } from '../dao/events.dao.js';

export class EventsRepository {
  constructor(dao) { this.dao = dao; }
  async findAll() { return this.dao.findAll(); }
}
export const eventsRepository = new EventsRepository(eventsDao);
