package com.docegestao.service;

import com.docegestao.dto.IngredientRequest;
import com.docegestao.dto.IngredientResponse;
import com.docegestao.entity.Ingredient;
import com.docegestao.repository.IngredientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IngredientService {

    private final IngredientRepository ingredientRepository;

    public List<IngredientResponse> findAll() {
        return ingredientRepository.findByActiveTrue()
                .stream().map(IngredientResponse::from).toList();
    }

    public IngredientResponse findById(Long id) {
        return IngredientResponse.from(getOrThrow(id));
    }

    @Transactional
    public IngredientResponse create(IngredientRequest req) {
        var ingredient = new Ingredient();
        ingredient.setName(req.getName());
        ingredient.setUnit(req.getUnit());
        ingredient.setMinQuantity(req.getMinQuantity());
        return IngredientResponse.from(ingredientRepository.save(ingredient));
    }

    @Transactional
    public IngredientResponse update(Long id, IngredientRequest req) {
        var ingredient = getOrThrow(id);
        ingredient.setName(req.getName());
        ingredient.setUnit(req.getUnit());
        ingredient.setMinQuantity(req.getMinQuantity());
        return IngredientResponse.from(ingredientRepository.save(ingredient));
    }

    @Transactional
    public void deactivate(Long id) {
        var ingredient = getOrThrow(id);
        ingredient.setActive(false);
        ingredientRepository.save(ingredient);
    }

    public Ingredient getOrThrow(Long id) {
        return ingredientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Insumo não encontrado: " + id));
    }
}
