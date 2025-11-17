# 🚀 Sistema de Gestión de Turnos Médicos (API)

## 📑 Tabla de Contenidos
Visión General

- Características y Beneficios

- Casos de Uso

- Estructura de la API

- Autenticación

## Visión General

Esta API constituye el motor backend del sistema de gestión automatizada de turnos médicos. Su diseño modular y seguro permite integrarse fácilmente con plataformas de automatización y agentes conversacionales, posibilitando la reserva y administración de turnos sin intervención humana.

El objetivo principal es ofrecer un sistema eficiente, confiable y escalable, que simplifique la experiencia tanto para el paciente como para el personal médico.

## Características y Beneficios Clave

| Característica                                  | Beneficio para el Sistema                                                                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🧠 **Lógica Inteligente de Disponibilidad**     | Evita sobre-reservas mediante el cálculo automático de espacios disponibles (slots de 30 minutos), considerando horarios regulares, excepciones y turnos ya tomados.      |
| 🤖 **Integración con Agentes Conversacionales** | Arquitectura API-first que facilita la conexión con chatbots o flujos de automatización, para ofrecer atención 24/7.                                                      |
| 🔐 **Seguridad de Acceso Controlado**           | Todas las rutas de la API (incluyendo la lectura GET) están protegidas por una API Key secreta, garantizando que solo los agentes autorizados puedan acceder a los datos. |
| 🗂️ **Gestión Integral de Datos (CRUD)**        | Endpoints CRUD para administrar Médicos, Pacientes, Turnos, Disponibilidad Regular y Excepciones.                                                                         |
| ⚡ **Tecnología Moderna**                        | Desarrollado con Node.js, Express y MySQL, asegurando velocidad, estabilidad y compatibilidad con entornos productivos.                                                   |

🎯 Casos de Uso


| Caso de Uso                           | Descripción                                                                                                                                                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 💬 **Reserva Automatizada de Turnos** | Un chatbot consulta la disponibilidad del médico (`GET /api/disponibilidad`), valida la hora y genera la reserva (`POST /api/turnos`) en tiempo real.                                                          |
| 🕓 **Gestión Avanzada de Horarios**   | Los administradores pueden registrar horarios regulares (`POST /api/disponibilidades`), definir días libres puntuales (`POST /api/excepciones`) o eliminar excepciones canceladas (`DELETE /api/excepciones`). |
| 🧾 **Panel de Administración Segura** | Una interfaz web privada consume la API para gestionar médicos, pacientes y turnos de forma centralizada (todas las rutas están protegidas con API Key).                                                       |

## 🌐 Estructura de la API

| Endpoint                         | Operaciones   | Descripción                                                                                                      |
| -------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/api/turnos`                    | CRUD          | Gestión completa de los turnos médicos.                                                                          |
| `/api/medicos`                   | CRUD          | Administración de la lista de profesionales.                                                                     |
| `/api/pacientes`                 | CRUD          | Control de la base de datos de pacientes.                                                                        |
| `/api/disponibilidades`          | CRUD          | Gestión del horario semanal fijo (días y horas de trabajo habituales).                                           |
| `/api/excepciones`               | POST / DELETE | Creación y eliminación de ausencias o horarios especiales para una fecha puntual.                                |
| `/api/disponibilidad/:id/:fecha` | GET           | Consulta detallada de los slots disponibles de un médico en una fecha específica, considerando todas las reglas. |

## 🔒 Autenticación

Todas las rutas requieren la API Key definida en las variables de entorno.

Enviar en el Header: