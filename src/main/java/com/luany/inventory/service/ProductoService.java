package com.luany.inventory.service;

import com.luany.inventory.model.Producto;
import com.luany.inventory.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;

    public List<Producto> listar() {
        return productoRepository.findAll();
    }

    public List<Producto> buscarPorNombre(String nombre) {
        return productoRepository.buscarPorNombre(nombre);
    }

    public List<Producto> productosConStockBajo() {
        return productoRepository.findStockBajo();
    }

    public String estadoStock(Producto p) {
        if (p.getStockActual() <= 0) {
            return "AGOTADO";
        }
        if (p.getStockActual() <= p.getStockMinimo()) {
            return "BAJO";
        }
        if (p.getStockActual() >= p.getStockMaximo()) {
            return "EXCESO";
        }
        return "NORMAL";
    }
}