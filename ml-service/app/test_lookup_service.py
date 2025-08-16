#!/usr/bin/env python3
"""
Test script for the pest disease lookup service.

This script tests the comprehensive lookup functionality including
name matching, symptom matching, and treatment recommendations.
"""

import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from pest_disease_lookup_service import lookup_service

def test_name_search():
    """Test name-based search functionality."""
    print("Testing name-based search...")
    
    # Test exact matches
    test_queries = [
        "aphids",
        "powdery mildew", 
        "tomato blight",
        "spider mites",
        "rust"
    ]
    
    for query in test_queries:
        print(f"\nSearching for: '{query}'")
        results = lookup_service.search_by_name(query, min_confidence=0.3)
        
        if results:
            print(f"  Found {len(results)} matches:")
            for i, result in enumerate(results[:3]):  # Show top 3
                print(f"    {i+1}. {result.key} (confidence: {result.confidence:.2f})")
                print(f"       Type: {result.match_type}")
                print(f"       Details: {result.match_details}")
        else:
            print("  No matches found")

def test_symptom_search():
    """Test symptom-based search functionality."""
    print("\n" + "="*50)
    print("Testing symptom-based search...")
    
    # Test symptom combinations
    test_symptoms = [
        ["yellowing leaves", "wilting"],
        ["spots on leaves", "brown patches"],
        ["sticky honeydew", "curled leaves"],
        ["white powdery coating", "distorted growth"]
    ]
    
    for symptoms in test_symptoms:
        print(f"\nSearching for symptoms: {symptoms}")
        results = lookup_service.search_by_symptoms(symptoms, min_confidence=0.2)
        
        if results:
            print(f"  Found {len(results)} matches:")
            for i, result in enumerate(results[:3]):  # Show top 3
                print(f"    {i+1}. {result.key} (confidence: {result.confidence:.2f})")
                print(f"       Category: {result.match_type}")
        else:
            print("  No matches found")

def test_treatment_recommendations():
    """Test treatment recommendation functionality."""
    print("\n" + "="*50)
    print("Testing treatment recommendations...")
    
    # First find a match to get treatments for
    results = lookup_service.search_by_name("aphids", min_confidence=0.3)
    
    if results:
        match = results[0]
        print(f"\nGetting treatments for: {match.key}")
        
        # Test all treatments
        all_treatments = lookup_service.get_treatment_recommendations(match)
        print(f"  All treatments ({len(all_treatments)}):")
        for i, treatment in enumerate(all_treatments):
            print(f"    {i+1}. {treatment.method}: {treatment.treatment}")
            print(f"       Priority: {treatment.priority}, Effectiveness: {treatment.effectiveness}")
        
        # Test organic only
        organic_treatments = lookup_service.get_treatment_recommendations(match, organic_only=True)
        print(f"\n  Organic treatments only ({len(organic_treatments)}):")
        for i, treatment in enumerate(organic_treatments):
            print(f"    {i+1}. {treatment.method}: {treatment.treatment}")
    else:
        print("  No matches found to test treatments")

def test_expert_resources():
    """Test expert resource functionality."""
    print("\n" + "="*50)
    print("Testing expert resources...")
    
    # Test all experts
    all_experts = lookup_service.get_expert_resources()
    print(f"All expert resources ({len(all_experts)}):")
    for i, expert in enumerate(all_experts):
        print(f"  {i+1}. {expert.name}")
        print(f"     Contact: {expert.contact}")
        print(f"     Type: {expert.type}")
        print(f"     Specialization: {expert.specialization}")
    
    # Test filtered experts
    disease_experts = lookup_service.get_expert_resources("disease")
    print(f"\nDisease specialists ({len(disease_experts)}):")
    for i, expert in enumerate(disease_experts):
        print(f"  {i+1}. {expert.name} - {expert.specialization}")

def test_comprehensive_analysis():
    """Test comprehensive analysis functionality."""
    print("\n" + "="*50)
    print("Testing comprehensive analysis...")
    
    # Test comprehensive analysis
    query = "tomato disease"
    symptoms = ["yellowing leaves", "brown spots", "wilting"]
    crop_type = "tomato"
    
    print(f"Query: '{query}'")
    print(f"Symptoms: {symptoms}")
    print(f"Crop type: {crop_type}")
    
    analysis = lookup_service.get_comprehensive_analysis(
        query=query,
        symptoms=symptoms,
        crop_type=crop_type
    )
    
    print(f"\nComprehensive Analysis Results:")
    print(f"  Name matches: {len(analysis['name_matches'])}")
    print(f"  Symptom matches: {len(analysis['symptom_matches'])}")
    print(f"  Combined recommendations: {len(analysis['combined_recommendations'])}")
    print(f"  Expert resources: {len(analysis['expert_resources'])}")
    
    if analysis['confidence_summary']:
        summary = analysis['confidence_summary']
        print(f"  Confidence Summary:")
        print(f"    Highest confidence: {summary['highest_confidence']:.2f}")
        print(f"    Average confidence: {summary['average_confidence']:.2f}")
        print(f"    Total matches: {summary['total_matches']}")
        print(f"    High confidence matches: {summary['high_confidence_matches']}")
    
    # Show top recommendation
    if analysis['combined_recommendations']:
        top_rec = analysis['combined_recommendations'][0]
        print(f"\n  Top Recommendation:")
        print(f"    Pest/Disease: {top_rec['pest_disease']}")
        print(f"    Confidence: {top_rec['confidence']:.2f}")
        print(f"    Treatments available: {len(top_rec['treatments'])}")

def test_database_status():
    """Test database loading status."""
    print("\n" + "="*50)
    print("Testing database status...")
    
    # Check if database loaded
    if hasattr(lookup_service, 'database') and lookup_service.database:
        pests_count = len(lookup_service.database.get('pests', {}))
        diseases_count = len(lookup_service.database.get('diseases', {}))
        print(f"  Database loaded successfully")
        print(f"  Pests: {pests_count}")
        print(f"  Diseases: {diseases_count}")
        print(f"  Total entries: {pests_count + diseases_count}")
    else:
        print("  ⚠ Database not loaded or empty")
    
    # Check expert resources
    experts = lookup_service.get_expert_resources()
    print(f"  Expert resources: {len(experts)}")

def main():
    """Run all lookup service tests."""
    print("Pest Disease Lookup Service Test")
    print("=" * 50)
    
    try:
        # Test database status first
        test_database_status()
        
        # Run all tests
        test_name_search()
        test_symptom_search()
        test_treatment_recommendations()
        test_expert_resources()
        test_comprehensive_analysis()
        
        print("\n" + "=" * 50)
        print("🎉 All lookup service tests completed!")
        print("\nThe lookup service is ready for integration with the disease identification service.")
        
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        print("Check that the pestsAndDiseases.json file exists and is properly formatted.")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)