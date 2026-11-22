package com.docegestao.dto;

import lombok.Data;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** Página de resultados com contrato estável para o frontend (não expõe o Page do Spring). */
@Data
public class PageResponse<T> {
    public List<T> content;
    public int     page;
    public int     size;
    public long    totalElements;
    public int     totalPages;

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return of(page.getContent().stream().map(mapper).toList(), page);
    }

    public static <T> PageResponse<T> of(List<T> content, Page<?> page) {
        var r = new PageResponse<T>();
        r.content       = content;
        r.page          = page.getNumber();
        r.size          = page.getSize();
        r.totalElements = page.getTotalElements();
        r.totalPages    = page.getTotalPages();
        return r;
    }
}
