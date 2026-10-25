package com.luany.inventory.repository;

import com.luany.inventory.model.Movimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MovimientoRepository extends JpaRepository<Movimiento, Long> {

    @Query("SELECT m FROM Movimiento m WHERE m.producto.id = :productoId ORDER BY m.fecha DESC")
    List<Movimiento> findPorProducto(@Param("productoId") Long productoId);
}