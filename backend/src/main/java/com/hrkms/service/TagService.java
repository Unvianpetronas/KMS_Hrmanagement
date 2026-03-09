package com.hrkms.service;

import com.hrkms.dto.TagDTO;
import com.hrkms.exception.ConflictException;
import com.hrkms.exception.ResourceNotFoundException;
import com.hrkms.model.Tag;
import com.hrkms.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepo;

    public List<TagDTO.TagResponse> getAllTags() {
        return tagRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public void deleteTag(String tagName) {
        if (!tagRepo.existsByName(tagName)) {
            throw new ResourceNotFoundException("Tag không tồn tại: " + tagName);
        }
        tagRepo.deleteByName(tagName);
    }

    public TagDTO.TagResponse updateTag(String tagName, TagDTO.UpdateTagRequest req) {
        Tag tag = tagRepo.findByName(tagName)
                .orElseThrow(() -> new ResourceNotFoundException("Tag không tồn tại: " + tagName));
        tag.setName(req.getName());
        tag.setDescription(req.getDescription());
        try {
            return toResponse(tagRepo.save(tag));
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Tag tên '" + req.getName() + "' đã tồn tại");
        }
    }

    public TagDTO.TagResponse createTag(TagDTO.CreateTagRequest req) {
        if (tagRepo.existsByName(req.getName())) {
            throw new ConflictException("Tag tên '" + req.getName() + "' đã tồn tại");
        }
        Tag tag = Tag.builder()
                .name(req.getName())
                .description(req.getDescription())
                .build();
        return toResponse(tagRepo.save(tag));
    }

    public TagDTO.TagResponse toResponse(Tag tag) {
        return new TagDTO.TagResponse(tag.getId(), tag.getName(), tag.getDescription(), tag.getCreatedDate());
    }
}
