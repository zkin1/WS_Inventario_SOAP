-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: ws_inventario_db
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ajustes`
--

DROP TABLE IF EXISTS `ajustes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ajustes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha_ajuste` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `producto_id` int NOT NULL,
  `ubicacion_id` int NOT NULL,
  `cantidad_anterior` int NOT NULL,
  `cantidad_nueva` int NOT NULL,
  `motivo_ajuste` varchar(100) NOT NULL,
  `descripcion` text,
  `usuario_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ajustes_producto` (`producto_id`),
  KEY `idx_ajustes_ubicacion` (`ubicacion_id`),
  CONSTRAINT `ajustes_ibfk_1` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ajustes`
--

LOCK TABLES `ajustes` WRITE;
/*!40000 ALTER TABLE `ajustes` DISABLE KEYS */;
/*!40000 ALTER TABLE `ajustes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos`
--

DROP TABLE IF EXISTS `movimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha_movimiento` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo_movimiento_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `ubicacion_origen_id` int DEFAULT NULL,
  `ubicacion_destino_id` int DEFAULT NULL,
  `cantidad` int NOT NULL,
  `documento_referencia` varchar(50) DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  `notas` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ubicacion_origen_id` (`ubicacion_origen_id`),
  KEY `ubicacion_destino_id` (`ubicacion_destino_id`),
  KEY `idx_movimientos_producto` (`producto_id`),
  KEY `idx_movimientos_tipo` (`tipo_movimiento_id`),
  CONSTRAINT `movimientos_ibfk_1` FOREIGN KEY (`tipo_movimiento_id`) REFERENCES `tipos_movimiento` (`id`),
  CONSTRAINT `movimientos_ibfk_2` FOREIGN KEY (`ubicacion_origen_id`) REFERENCES `ubicaciones` (`id`),
  CONSTRAINT `movimientos_ibfk_3` FOREIGN KEY (`ubicacion_destino_id`) REFERENCES `ubicaciones` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos`
--

LOCK TABLES `movimientos` WRITE;
/*!40000 ALTER TABLE `movimientos` DISABLE KEYS */;
INSERT INTO `movimientos` VALUES (1,'2025-05-05 19:51:02',1,1,NULL,1,100,'INGRESO-001',NULL,'Ingreso inicial de mercancía','2025-05-05 19:51:02');
/*!40000 ALTER TABLE `movimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock`
--

DROP TABLE IF EXISTS `stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int NOT NULL,
  `ubicacion_id` int NOT NULL,
  `cantidad` int NOT NULL DEFAULT '0',
  `stock_minimo` int DEFAULT '0',
  `stock_maximo` int DEFAULT '0',
  `ultima_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_producto_ubicacion` (`producto_id`,`ubicacion_id`),
  KEY `idx_stock_producto` (`producto_id`),
  KEY `idx_stock_ubicacion` (`ubicacion_id`),
  CONSTRAINT `stock_ibfk_1` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock`
--

LOCK TABLES `stock` WRITE;
/*!40000 ALTER TABLE `stock` DISABLE KEYS */;
INSERT INTO `stock` VALUES (1,1,1,100,0,0,'2025-05-05 19:51:02','2025-05-05 19:51:02','2025-05-05 19:51:02');
/*!40000 ALTER TABLE `stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_movimiento`
--

DROP TABLE IF EXISTS `tipos_movimiento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_movimiento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `afecta_stock` int NOT NULL COMMENT '1: Suma, -1: Resta, 0: No afecta',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_movimiento`
--

LOCK TABLES `tipos_movimiento` WRITE;
/*!40000 ALTER TABLE `tipos_movimiento` DISABLE KEYS */;
INSERT INTO `tipos_movimiento` VALUES (1,'ENTRADA','Entrada de mercancía','Ingreso de productos al inventario',1,'2025-05-05 19:38:25'),(2,'SALIDA','Salida de mercancía','Salida de productos del inventario',-1,'2025-05-05 19:38:25'),(3,'TRASPASO','Traspaso entre ubicaciones','Movimiento de productos entre ubicaciones',0,'2025-05-05 19:38:25'),(4,'DEVOLUCION','Devolución','Devolución de productos al inventario',1,'2025-05-05 19:38:25'),(5,'BAJA','Baja','Baja de productos por daño o pérdida',-1,'2025-05-05 19:38:25');
/*!40000 ALTER TABLE `tipos_movimiento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ubicaciones`
--

DROP TABLE IF EXISTS `ubicaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ubicaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ubicaciones`
--

LOCK TABLES `ubicaciones` WRITE;
/*!40000 ALTER TABLE `ubicaciones` DISABLE KEYS */;
INSERT INTO `ubicaciones` VALUES (1,'BOD-PRIN','Bodega Principal','Bodega principal de almacenamiento',1,'2025-05-05 19:50:53','2025-05-05 19:50:53');
/*!40000 ALTER TABLE `ubicaciones` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-06 16:33:50
