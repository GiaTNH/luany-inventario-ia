package com.luany.inventory.service;

import com.luany.inventory.model.BloqueoIp;
import com.luany.inventory.repository.BloqueoIpRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BloqueoIpServiceTests {

    private static final String IP = "192.0.2.1";
    private static final Instant AHORA_INSTANT = Instant.parse("2026-06-01T12:00:00Z");
    private static final ZoneId ZONA = ZoneId.of("America/Lima");

    @Mock
    private BloqueoIpRepository bloqueoIpRepository;

    private BloqueoIpService service;
    private LocalDateTime ahora;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(AHORA_INSTANT, ZONA);
        service = new BloqueoIpService(bloqueoIpRepository, clock);
        ReflectionTestUtils.setField(service, "ventanaMinutos", 15);
        ahora = LocalDateTime.now(clock);
    }

    // ── verificar ────────────────────────────────────────────────────────────

    @Test
    void verificarConIpNulaNoLanzaExcepcion() {
        assertDoesNotThrow(() -> service.verificar(null));
        verifyNoInteractions(bloqueoIpRepository);
    }

    @Test
    void verificarConIpVaciaNoLanzaExcepcion() {
        assertDoesNotThrow(() -> service.verificar("   "));
        verifyNoInteractions(bloqueoIpRepository);
    }

    @Test
    void verificarSinBloqueoActivoNoLanzaExcepcion() {
        when(bloqueoIpRepository.buscarBloqueoActivo(eq(IP), any())).thenReturn(Optional.empty());
        assertDoesNotThrow(() -> service.verificar(IP));
    }

    @Test
    void verificarConBloqueoVigenteDevuelve429() {
        BloqueoIp bloqueo = bloqueoConIntentos(5, ahora.plusMinutes(10));
        when(bloqueoIpRepository.buscarBloqueoActivo(eq(IP), any())).thenReturn(Optional.of(bloqueo));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class, () -> service.verificar(IP));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatusCode());
        assertTrue(ex.getReason().contains("15 minutos"));
    }

    // ── registrarFallido — IP nula o vacía ───────────────────────────────────

    @Test
    void registrarFallidoConIpNulaRetornaFalseSinTocarRepositorio() {
        assertFalse(service.registrarFallido(null));
        verifyNoInteractions(bloqueoIpRepository);
    }

    @Test
    void registrarFallidoConIpVaciaRetornaFalseSinTocarRepositorio() {
        assertFalse(service.registrarFallido(""));
        verifyNoInteractions(bloqueoIpRepository);
    }

    // ── registrarFallido — bloqueo vigente ───────────────────────────────────

    @Test
    void registrarFallidoConBloqueoVigenteRetornaTrueSinGuardar() {
        BloqueoIp bloqueo = bloqueoConIntentos(5, ahora.plusMinutes(10));
        when(bloqueoIpRepository.buscarParaBloqueo(IP)).thenReturn(Optional.of(bloqueo));

        assertTrue(service.registrarFallido(IP));

        verify(bloqueoIpRepository).upsertIntentoFallido(eq(IP), any(), any());
        verify(bloqueoIpRepository, never()).save(any());
    }

    // ── registrarFallido — contador por debajo del límite ────────────────────

    @Test
    void registrarFallidoConCuatroIntentosRetornaFalseSinGuardar() {
        BloqueoIp bloqueo = bloqueoConIntentos(4, null);
        when(bloqueoIpRepository.buscarParaBloqueo(IP)).thenReturn(Optional.of(bloqueo));

        assertFalse(service.registrarFallido(IP));

        verify(bloqueoIpRepository).upsertIntentoFallido(eq(IP), any(), any());
        verify(bloqueoIpRepository, never()).save(any());
    }

    // ── registrarFallido — quinto intento aplica bloqueo ─────────────────────

    @Test
    void registrarFallidoConCincoIntentosAplicaBloqueadoHastaYRetornaTrue() {
        BloqueoIp bloqueo = bloqueoConIntentos(5, null);
        when(bloqueoIpRepository.buscarParaBloqueo(IP)).thenReturn(Optional.of(bloqueo));

        assertTrue(service.registrarFallido(IP));

        verify(bloqueoIpRepository).upsertIntentoFallido(eq(IP), any(), any());
        verify(bloqueoIpRepository).save(bloqueo);
        assertNotNull(bloqueo.getBloqueadoHasta());
        assertFalse(bloqueo.getBloqueadoHasta().isBefore(ahora));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private BloqueoIp bloqueoConIntentos(int intentos, LocalDateTime bloqueadoHasta) {
        BloqueoIp b = new BloqueoIp();
        b.setIp(IP);
        b.setIntentos(intentos);
        b.setPrimeraVez(ahora.minusMinutes(5));
        b.setUltimaVez(ahora);
        b.setBloqueadoHasta(bloqueadoHasta);
        return b;
    }
}
