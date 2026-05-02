# 1. Usamos una imagen base oficial de Node
FROM node:18

# 2. Creamos una carpeta dentro del contenedor
WORKDIR /app

# 3. Copiamos solo los archivos de dependencias primero
# (esto mejora el rendimiento del build)
COPY package*.json ./

# 4. Instalamos las dependencias
RUN npm install

# 5. Copiamos el resto del proyecto
COPY . .

# 6. Exponemos el puerto (ajústalo si usas otro)
EXPOSE 3000

# 7. Comando para iniciar la app
CMD ["node", "server.js"]