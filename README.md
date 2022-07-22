# gateway-consumer-types

## Usage

1.  Install Package
    `npm i gateway-consumer-types`

2.  Import types
    `import {ServiceAMS} from "gateway-consumer-types`

## Types available

Gateway consumer currently uses the following as required types

| service-name      | type             |
| ----------------- | ---------------- |
| `service-ams`     | 'ServiceAMS'     |
| `service-project` | 'ServiceProject' |
| `service-member`  | 'ServiceMember   |
| `service-job`     | 'ServiceJob'     |
| `service-dao`     | 'ServiceDAO'     |

## Standard response from gateway-consumer

1. Success response
   `{ message: "Success message" data: response data }`
2. Error response
   `{ message: "Error message" error: Actual error }`
