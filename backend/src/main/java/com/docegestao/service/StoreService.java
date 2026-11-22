package com.docegestao.service;

import com.docegestao.dto.StoreRequest;
import com.docegestao.dto.StoreResponse;
import com.docegestao.entity.Store;
import com.docegestao.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;

    public List<StoreResponse> findAll() {
        return storeRepository.findByActiveTrue()
                .stream().map(StoreResponse::from).toList();
    }

    public StoreResponse findById(Long id) {
        return StoreResponse.from(getOrThrow(id));
    }

    @Transactional
    public StoreResponse create(StoreRequest req) {
        // Verifica nome duplicado ANTES de tentar salvar (mensagem clara no Toast)
        if (storeRepository.existsByNameIgnoreCase(req.getName())) {
            throw new BusinessException(
                "Já existe uma loja com o nome \"" + req.getName() + "\". Escolha outro nome."
            );
        }
        var store = new Store();
        store.setName(req.getName());
        store.setAddress(req.getAddress());
        store.setPhone(req.getPhone());
        return StoreResponse.from(storeRepository.save(store));
    }

    @Transactional
    public StoreResponse update(Long id, StoreRequest req) {
        var store = getOrThrow(id);

        // Verifica nome duplicado excluindo a própria loja do check
        if (storeRepository.existsByNameIgnoreCaseAndIdNot(req.getName(), id)) {
            throw new BusinessException(
                "Já existe outra loja com o nome \"" + req.getName() + "\". Escolha outro nome."
            );
        }

        store.setName(req.getName());
        store.setAddress(req.getAddress());
        store.setPhone(req.getPhone());
        return StoreResponse.from(storeRepository.save(store));
    }

    @Transactional
    public void deactivate(Long id) {
        var store = getOrThrow(id);
        store.setActive(false);
        storeRepository.save(store);
    }

    public Store getOrThrow(Long id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loja não encontrada: " + id));
    }
}
