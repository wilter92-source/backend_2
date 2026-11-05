// Fuente vacía temporal autorizada por la consigna. No persiste datos.
export class EventsDAO {
  async findAll() { return []; }
}
export const eventsDao = new EventsDAO();
