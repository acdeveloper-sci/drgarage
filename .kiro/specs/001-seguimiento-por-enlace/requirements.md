# Requirements Document

## Introduction

Feature 01 de drGarage: permite al cliente seguir el estado de su auto desde un enlace público sin necesidad de llamar al taller.

## Glossary

- **Sistema**: La aplicación drGarage.
- **Token público**: Identificador único y aleatorio (≥128 bits) asociado a cada auto para la vista del cliente.
- **Estado**: Fase actual del vehículo: Recibido, En proceso, Cotización enviada, Listo.
- **Evento**: Registro de actividad en la ficha del auto (cambio de estado, aviso enviado, etc.).
- **Vista del taller**: Panel del mecánico donde se registran autos y gestionan estados.
- **Vista del cliente**: Página pública /auto/{token} donde el cliente consulta el avance.
- **wa.me**: URL pública de WhatsApp para iniciar una conversación sin guardar el número.
- **Sondeo**: Consulta periódica al servidor para obtener datos actualizados.
- **UTC**: Tiempo Universal Coordinado; todas las fechas se almacenan en UTC.

## Requirements

### Requirement 1: Registro de ingreso de auto

**User Story:** Como mecánico, quiero registrar el ingreso de un auto para que el cliente pueda seguir su estado.

#### Acceptance Criteria

1. **WHEN** el mecánico completa el formulario con nombre, WhatsApp de 10 dígitos, placa y modelo, **THE** Sistema **SHALL** crear el auto en estado "Recibido" con un enlace público único, guardar la placa en mayúsculas y abrir la ficha del auto.

2. **WHEN** el mecánico intenta guardar con un campo obligatorio vacío o con un WhatsApp que no tenga 10 dígitos, **THE** Sistema **SHALL** mostrar un error que indique cómo corregirlo y conservar los datos ingresados.

### Requirement 2: Cambio de estado del auto

**User Story:** Como mecánico, quiero cambiar el estado del auto para mantener informado al cliente.

#### Acceptance Criteria

1. **WHEN** el mecánico toca un estado diferente al actual en la ficha del auto, **THE** Sistema **SHALL** guardar el nuevo estado, crear un evento con la fecha y hora, y mostrar un aviso para notificar al cliente.

### Requirement 3: Notificación por WhatsApp

**User Story:** Como mecánico, quiero enviar un mensaje al cliente con un clic para informarle el estado de su auto.

#### Acceptance Criteria

1. **WHEN** el mecánico toca el botón de WhatsApp en la ficha del auto, **THE** Sistema **SHALL** abrir https://wa.me/57{whatsapp}?text= con un mensaje que incluya el primer nombre del cliente, modelo, placa, estado actual y el enlace del auto.

### Requirement 4: Vista pública del cliente

**User Story:** Como cliente, quiero ver el estado de mi auto desde un enlace sin registrarme.

#### Acceptance Criteria

1. **WHEN** el cliente abre un enlace válido /auto/{token}, **THE** Sistema **SHALL** mostrar la placa, el modelo, el estado actual, el avance en 4 pasos y la hora de última actualización, sin necesidad de registro.

2. **WHEN** el cliente visualiza la página, **THE** Sistema **SHALL NOT** mostrar el número de WhatsApp ni datos de otros autos.

3. **WHEN** el cliente abre un enlace con un token que no existe, **THE** Sistema **SHALL** mostrar el mensaje "Este enlace ya no está activo".

### Requirement 5: Actualización en tiempo real

**User Story:** Como cliente, quiero ver los cambios de estado sin tener que recargar la página.

#### Acceptance Criteria

1. **WHEN** la página del cliente está abierta y el mecánico cambia el estado del auto, **THE** Sistema **SHALL** mostrar el nuevo estado en un máximo de 30 segundos sin recargar.

### Requirement 6: Manejo de errores de conexión

**User Story:** Como mecánico, quiero saber si mi cambio no se guardó por problemas de conexión.

#### Acceptance Criteria

1. **WHEN** ocurre un error de red al intentar guardar el registro o un cambio de estado, **THE** Sistema **SHALL** mostrar un mensaje de error en pantalla indicando que la operación no se completó y permitir reintentar la acción.

2. **WHEN** se muestra el error de conexión, **THE** Sistema **SHALL NOT** marcar la operación como completada hasta que el servidor confirme el guardado.

---

*Documento generado para el feature seguimiento-por-enlace" de drGarage.*
