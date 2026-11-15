# Evidencia de ejecución

Prueba con MongoDB 7.0.28 y el servidor estándar del proyecto. Los datos corresponden a una cuenta ficticia.

## Registro exitoso · HTTP 201

```json
{
  "status": "success",
  "payload": {
    "id": "6af9dad197885d2224c92526",
    "first_name": "Ana",
    "last_name": "Pérez",
    "email": "ana@example.com",
    "role": "user"
  }
}
```

## Documento guardado · colección users

El identificador coincide con el de la respuesta HTTP. El campo `password` contiene el hash bcrypt de la cuenta de prueba.

```json
{
  "_id": "6af9dad197885d2224c92526",
  "first_name": "Ana",
  "last_name": "Pérez",
  "email": "ana@example.com",
  "password": "$2b$12$O/3loadSGuVaCOpNGb4dSeRrYlmrpisoQPrOWsOjUxj9OxczFRlEe",
  "role": "user"
}
```

## Correo inválido · HTTP 400

```json
{
  "status": "error",
  "message": "Formato de email inválido"
}
```

## Correo duplicado · HTTP 409

```json
{
  "status": "error",
  "message": "El email ya está registrado"
}
```
