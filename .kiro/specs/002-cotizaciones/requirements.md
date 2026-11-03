# Requirements Document

## Introduction

Feature 02 de drGarage: cotizaciones con aprobación del cliente. Se construye sobre el feature 01, ya desplegado, y no cambia sus rutas, tablas ni comportamiento salvo lo indicado aquí.

Cuando el mecánico encuentra una reparación adicional, necesita la aprobación del cliente para seguir. Hoy la pide por llamada o WhatsApp suelto: el cliente tarda horas en contestar, el auto se queda frenado ocupando espacio, y no queda registro de qué aprobó ni cuándo. Eso termina en discusiones ("yo no autoricé eso") y en rebajas en la cuenta.

**Usuario principal:** el dueño o mecánico del taller. **Usuario secundario:** el cliente, desde el mismo enlace del feature 01.

## Glossary

- **Sistema**: La aplicación drGarage.
- **Cotización**: Propuesta de reparación adicional con descripción y costo.
- **Estado de cotización**: Pendiente (esperando decisión), aprobada, rechazada o anulada (reemplazada por otra pendiente).
- **Nota**: Razón opcional que el cliente puede dar al rechazar (máx. 140 caracteres).
- **Enlace del auto**: URL pública `/auto/{token}` del feature 01.

## Requirements

### Requirement 1: Crear cotización

**User Story:** Como mecánico, quiero crear una cotización para una reparación adicional para obtener la aprobación del cliente sin depender de llamadas.

#### Acceptance Criteria

1. **WHEN** el mecánico guarda, en la ficha de un auto, una descripción y un costo mayor que 0, **THE** Sistema **SHALL** dejar la cotización Pendiente con fecha y hora de envío, pasar el auto a "Cotización enviada" y registrar un evento.

2. **WHEN** el auto ya tenía otra cotización pendiente, **THE** Sistema **SHALL** pasar esa a Anulada.

3. **WHEN** falta la descripción o el costo no es válido, **THE** Sistema **SHALL** mostrar un error que diga cómo corregirlo y conservar lo escrito.

### Requirement 2: Mensaje de WhatsApp

**User Story:** Como mecánico, quiero enviar la cotización al cliente por WhatsApp con un toque para que la reciba en su celular.

#### Acceptance Criteria

1. **WHEN** el mecánico toca el botón verde en la ficha de un auto con una cotización pendiente, **THE** Sistema **SHALL** abrir `wa.me` con el mensaje de cotización, que incluye primer nombre, modelo, placa, descripción, costo con formato `$380.000` y el enlace del auto.

### Requirement 3: Aprobar

**User Story:** Como cliente, quiero aprobar la cotización desde mi enlace para que el taller continúe sin que yo llame.

#### Acceptance Criteria

1. **WHEN** el cliente toca Aprobar en su página con una cotización pendiente, **THE** Sistema **SHALL** dejar la cotización Aprobada con fecha y hora, y reemplazar los botones por "Aprobada el {fecha}".

2. **WHEN** la cotización queda Aprobada, **THE** Sistema **SHALL** mostrar "Cotización aprobada" para ese auto en la lista del taller.

### Requirement 4: Rechazar con nota

**User Story:** Como cliente, quiero rechazar la cotización y poder decir por qué, para que el taller entienda mi decisión.

#### Acceptance Criteria

1. **WHEN** el cliente toca Rechazar, escribe o elige una nota (opcional, máx. 140 caracteres) y envía, **THE** Sistema **SHALL** dejar la cotización Rechazada con fecha, hora y nota.

2. **WHEN** la cotización queda Rechazada, **THE** Sistema **SHALL** mostrar la nota del cliente en el historial de la ficha del taller.

### Requirement 5: Decisión única y segura

**User Story:** Como mecánico, quiero que la decisión del cliente sea definitiva y quede registrada, para evitar disputas.

#### Acceptance Criteria

1. **WHEN** llega otra decisión para una cotización ya aprobada, rechazada o anulada (doble toque, otra pestaña, o un token que no corresponde al auto), **THE** Sistema **SHALL** no modificarla y devolver el estado existente.

2. **WHEN** se consulta la ficha del taller, **THE** Sistema **SHALL** listar en el historial todas las cotizaciones con estado, monto, descripción, fecha de envío, fecha de decisión y nota.

## Success Metrics

Se calculan con los datos de cotizaciones y autos (consulta SQL en Supabase), sin contar los autos de demostración; no requieren pantalla nueva. No se miden visitas ni páginas vistas.

| Métrica | Definición | Meta para el piloto (4 semanas) |
| --- | --- | --- |
| **Tiempo de decisión (principal)** | Mediana de `decidida_en − enviada_en` en cotizaciones decididas | Menos de 2 horas (línea base estimada: medio día) |
| **Respuesta en el día** | % de cotizaciones decididas en menos de 24 h | ≥ 80 % |
| **Tasa de respuesta** | Decididas ÷ (enviadas − anuladas) | ≥ 90 % |
| **Activación (time to value)** | Horas entre el primer auto registrado y la primera cotización decidida por un cliente | ≤ 48 h |
| **Retención** | Semanas del piloto con al menos una cotización enviada | ≥ 3 de 4 |
| **Disputas (control)** | Reclamos de "yo no autoricé eso" reportados por el taller | 0 |

La tasa de aprobación (aprobadas ÷ decididas) se observa pero no es meta: el objetivo es que el cliente decida rápido e informado, no que apruebe todo.

## Out of Scope

- Foto de la reparación (queda para una versión siguiente; requiere Storage).
- Código de acceso del taller, entrega del auto y vencimiento del enlace.
- Cambio automático del estado del auto al aprobar.
- Notificaciones automáticas; el aviso sigue siendo por el botón de WhatsApp.
- Límite de intentos en la decisión pública: queda como límite conocido; la protección es el token no adivinable y la decisión única.
