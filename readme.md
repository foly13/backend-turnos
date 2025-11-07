🚀 Sistema de Gestión de Turnos Médicos (API)
💡 Visión General

Esta API constituye el motor backend del sistema de gestión automatizada de turnos médicos.
Su diseño modular y seguro permite integrarse fácilmente con plataformas de automatización y agentes conversacionales, posibilitando la reserva y administración de turnos sin intervención humana.

El objetivo principal es ofrecer un sistema eficiente, confiable y escalable, que simplifique la experiencia tanto para el paciente como para el personal médico.

✨ Características y Beneficios Clave
| **Característica**                              | **Beneficio para el Sistema**                                                                                                                                                      |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🧠 **Lógica Inteligente de Disponibilidad**     | Evita sobre-reservas mediante el cálculo automático de espacios disponibles (slots de 30 minutos), considerando horarios regulares, excepciones y turnos ya tomados.               |
| 🤖 **Integración con Agentes Conversacionales** | Arquitectura *API-first* que facilita la conexión con chatbots o flujos de automatización, para ofrecer atención 24/7.                                     |
| 🔐 **Seguridad de Acceso Controlado**           | Las rutas sensibles (creación, actualización, eliminación) están protegidas por una **API Key secreta**, garantizando que solo los agentes autorizados puedan acceder a los datos. |
| 🗂️ **Gestión Integral de Datos**               | Endpoints CRUD para administrar fácilmente **Médicos**, **Pacientes** y **Turnos**.                                                                                                |
| ⚡ **Tecnología Moderna**                        | Desarrollado con **Node.js**, **Express** y **MySQL**, asegurando velocidad, estabilidad y compatibilidad con entornos productivos.                                                |

🎯 Casos de Uso
| **Caso de Uso**                       | **Descripción**                                                                                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 💬 **Reserva Automatizada de Turnos** | Un chatbot consulta la disponibilidad del médico (`GET /api/disponibilidad`), valida la hora y genera la reserva (`POST /api/turnos`) en tiempo real. |
| 🧾 **Panel de Administración Segura** | Una interfaz web privada consume la API para gestionar médicos, pacientes y turnos de forma centralizada.                                             |

| 🕓 **Gestión de Horarios**            | Los administradores pueden registrar horarios regulares, días libres o excepciones personalizadas mediante los endpoints correspondientes.            |

🌐 Estructura de la API

Todas las rutas siguen una arquitectura RESTful y están agrupadas bajo el prefijo /api/.
| **Endpoint**                           | **Descripción**                                                     |
| -------------------------------------- | ------------------------------------------------------------------- |
| `/api/turnos`                          | Gestión completa de los turnos médicos.                             |
| `/api/medicos`                         | Administración de la lista de profesionales.                        |
| `/api/pacientes`                       | Control de la base de datos de pacientes.                           |
| `/api/disponibilidad/:medicoId/:fecha` | Consulta detallada de la agenda del médico en una fecha específica. |

📈 Valor Agregado

Integración fluida con sistemas externos y flujos automatizados.

Diseño escalable, adaptable a consultorios individuales o redes médicas más amplias.

Posibilidad de expansión hacia paneles de gestión, bots inteligentes o sistemas de recordatorio automático.